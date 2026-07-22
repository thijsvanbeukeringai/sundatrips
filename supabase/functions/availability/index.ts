// Supabase Edge Function: availability
//
// Returns real-time availability for a listing so the mobile app can show only
// bookable options. Runs with the service-role key because the room-based check
// needs to read the owner-only `rooms` table (the web app does the same via its
// admin client in getAvailableRoomsForBooking / getAvailableVariants).
//
// Request (POST JSON):
//   stays:           { property_id, check_in, check_out }
//   activities/trips:{ property_id, date }
//
// Response:
//   { kind: 'variants', variants: [{ id, name, price_per_unit, price_unit, max_capacity, rooms_available }] }
//   { kind: 'slots',    slots:    [{ id, start_time, spots_left, max_capacity, full }] }
//   { kind: 'none' }   (transfers / other types — book by date only)
//
// Deploy: supabase functions deploy availability --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ISO weekday for a YYYY-MM-DD string (1 = Mon … 7 = Sun).
function isoWeekday(date: string): number {
  const d = new Date(date + 'T12:00:00')
  return ((d.getDay() + 6) % 7) + 1
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { property_id?: string; check_in?: string; check_out?: string; date?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.property_id) return json({ error: 'property_id is required' }, 400)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: property } = await supabase
    .from('properties')
    .select('id, type, max_capacity, duration_hours')
    .eq('id', body.property_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!property) return json({ error: 'Listing not found' }, 404)

  // ── Stays: available room-types for the date range ─────────────────────────
  if (property.type === 'stay') {
    const { check_in: checkIn, check_out: checkOut } = body
    if (!checkIn || !checkOut) return json({ error: 'check_in and check_out are required' }, 400)

    const { data: variants } = await supabase
      .from('listing_variants')
      .select('id, name, price_per_unit, price_unit, max_capacity')
      .eq('property_id', property.id)
      .eq('is_active', true)
      .order('sort_order')

    if (!variants || variants.length === 0) return json({ kind: 'variants', variants: [] })

    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, variant_id')
      .eq('property_id', property.id)
      .eq('is_active', true)
      .neq('status', 'maintenance')

    if (rooms && rooms.length > 0) {
      // Room-based: a variant is available if it has >= 1 room with no overlapping booking.
      const roomIds = rooms.map((r) => r.id)
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('room_id')
        .in('room_id', roomIds)
        .in('status', ['pending', 'confirmed', 'checked_in'])
        .lt('check_in', checkOut)
        .or(`check_out.gt.${checkIn},check_out.is.null`)

      const booked = new Set((conflicts ?? []).map((b) => b.room_id))
      const available = variants
        .map((v) => {
          const free = rooms.filter((r) => r.variant_id === v.id && !booked.has(r.id)).length
          return { ...v, rooms_available: free }
        })
        .filter((v) => v.rooms_available > 0)
      return json({ kind: 'variants', variants: available })
    }

    // Legacy fallback: no rooms configured — one booking per variant at a time.
    const variantIds = variants.map((v) => v.id)
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('variant_id')
      .eq('property_id', property.id)
      .in('variant_id', variantIds)
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .lt('check_in', checkOut)
      .or(`check_out.gt.${checkIn},check_out.is.null`)

    const conflictIds = new Set((conflicts ?? []).map((b) => b.variant_id))
    const available = variants
      .filter((v) => !conflictIds.has(v.id))
      .map((v) => ({ ...v, rooms_available: 1 }))
    return json({ kind: 'variants', variants: available })
  }

  // ── Activities / trips: time slots with remaining spots ────────────────────
  if (property.type === 'activity' || property.type === 'trip') {
    const date = body.date
    if (!date) return json({ error: 'date is required' }, 400)

    const { data: slots } = await supabase
      .from('time_slots')
      .select('id, start_time, days_of_week, sort_order')
      .eq('property_id', property.id)
      .eq('is_active', true)
      .order('sort_order')
      .order('start_time')

    if (!slots || slots.length === 0) return json({ kind: 'slots', slots: [] })

    const dow = isoWeekday(date)
    const daySlots = slots.filter(
      (s) => !s.days_of_week || s.days_of_week.length === 0 || s.days_of_week.includes(dow)
    )
    if (daySlots.length === 0) return json({ kind: 'slots', slots: [] })

    const { data: slotAvail } = await supabase
      .from('slot_availability')
      .select('time_slot_id, available_spots')
      .eq('property_id', property.id)
      .eq('date', date)

    const availMap = new Map<string, number>()
    for (const sa of slotAvail ?? []) availMap.set(sa.time_slot_id, sa.available_spots)

    const maxCap = property.max_capacity ?? 99
    const result = daySlots.map((s) => {
      const spots = availMap.has(s.id) ? availMap.get(s.id)! : maxCap
      return {
        id: s.id,
        start_time: s.start_time,
        spots_left: spots,
        max_capacity: maxCap,
        full: spots <= 0,
      }
    })
    return json({ kind: 'slots', slots: result })
  }

  // ── Transfers / other: no calendar — booked by date only ───────────────────
  return json({ kind: 'none' })
})
