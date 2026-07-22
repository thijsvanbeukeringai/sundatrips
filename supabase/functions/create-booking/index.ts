// Supabase Edge Function: create-booking
//
// Creates a public booking *request* (status = pending, payment_method = cash)
// on behalf of an unauthenticated guest. Runs with the service-role key so it
// can bypass RLS — the same trick the web app uses in createPublicBooking, kept
// server-side so the secret never ships to the mobile app.
//
// IMPORTANT: No payment is taken here. The guest only submits a request; payment
// is handled outside the app.
//
// Deploy:   supabase functions deploy create-booking --no-verify-jwt
// Secrets:  supabase secrets set MAILGUN_API_KEY=... MAILGUN_DOMAIN=... \
//                                MAILGUN_FROM="Sunda Trips <noreply@sundatrips.com>" \
//                                SITE_URL=https://sundatrips.com
//           (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface BookingInput {
  property_id: string
  guest_name: string
  guest_email: string
  guest_phone?: string | null
  guests_count: number
  check_in: string
  check_out?: string | null
  pickup_time?: string | null
  variant_id?: string | null
  time_slot_id?: string | null
  slot_label?: string | null
  base_amount: number
  notes?: string
}

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

function formatIDR(amount: number) {
  const digits = Math.round(amount).toString()
  return `Rp ${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

async function sendMailWithTemplate(opts: {
  to: string
  subject: string
  template: string
  variables: Record<string, string>
}) {
  const apiKey = Deno.env.get('MAILGUN_API_KEY')
  const domain = Deno.env.get('MAILGUN_DOMAIN')
  if (!apiKey || !domain) {
    console.warn('[create-booking] Mailgun not configured — skipping email')
    return
  }
  const from = Deno.env.get('MAILGUN_FROM') ?? `Sunda Trips <noreply@${domain}>`
  const base = `https://api.eu.mailgun.net/v3/${domain}`

  const form = new URLSearchParams()
  form.append('from', from)
  form.append('to', opts.to)
  form.append('subject', opts.subject)
  form.append('template', opts.template)
  form.append('h:X-Mailgun-Variables', JSON.stringify(opts.variables))

  const res = await fetch(`${base}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
    body: form,
  })
  if (!res.ok) {
    throw new Error(`Mailgun error (${res.status}): ${await res.text()}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let input: BookingInput
  try {
    input = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  // ── Validate ────────────────────────────────────────────────────────────
  const email = (input.guest_email ?? '').trim().toLowerCase()
  if (!input.property_id) return json({ error: 'property_id is required' }, 400)
  if (!input.guest_name?.trim()) return json({ error: 'guest_name is required' }, 400)
  if (!email || !email.includes('@')) return json({ error: 'A valid guest_email is required' }, 400)
  if (!input.check_in) return json({ error: 'check_in is required' }, 400)
  if (!input.guests_count || input.guests_count < 1) {
    return json({ error: 'guests_count must be at least 1' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── Look up the property (need its owner_id and details for emails) ───────
  const { data: property, error: propErr } = await supabase
    .from('properties')
    .select(
      'id, name, type, location, island, owner_id, is_active, duration, max_capacity, ' +
        'transfer_from, transfer_to, private_tour_price'
    )
    .eq('id', input.property_id)
    .single()

  if (propErr || !property) return json({ error: 'Listing not found' }, 404)
  if (!property.is_active) return json({ error: 'This listing is not available' }, 400)

  // ── Availability check (authoritative — prevents double bookings) ─────────
  let assignedRoomId: string | null = null

  if (property.type === 'stay') {
    if (!input.check_out) return json({ error: 'A check-out date is required for stays.' }, 400)

    const { data: variants } = await supabase
      .from('listing_variants')
      .select('id')
      .eq('property_id', property.id)
      .eq('is_active', true)

    if (variants && variants.length > 0 && !input.variant_id) {
      return json({ error: 'Please select a room type.' }, 400)
    }

    // Room-based assignment when the property has rooms; else variant-level lock.
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, variant_id')
      .eq('property_id', property.id)
      .eq('is_active', true)
      .neq('status', 'maintenance')
      .order('sort_order')
      .order('room_number')

    if (rooms && rooms.length > 0) {
      const candidateRooms = input.variant_id
        ? rooms.filter((r) => r.variant_id === input.variant_id)
        : rooms
      const roomIds = candidateRooms.map((r) => r.id)
      if (roomIds.length === 0) {
        return json({ error: 'No rooms available for these dates.' }, 409)
      }
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('room_id')
        .in('room_id', roomIds)
        .in('status', ['pending', 'confirmed', 'checked_in'])
        .lt('check_in', input.check_out)
        .or(`check_out.gt.${input.check_in},check_out.is.null`)

      const booked = new Set((conflicts ?? []).map((b) => b.room_id))
      assignedRoomId = candidateRooms.find((r) => !booked.has(r.id))?.id ?? null
      if (!assignedRoomId) return json({ error: 'No rooms available for these dates.' }, 409)
    } else if (input.variant_id) {
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', property.id)
        .eq('variant_id', input.variant_id)
        .in('status', ['pending', 'confirmed', 'checked_in'])
        .lt('check_in', input.check_out)
        .or(`check_out.gt.${input.check_in},check_out.is.null`)
        .limit(1)
      if (conflicts && conflicts.length > 0) {
        return json({ error: 'This room type is not available for these dates.' }, 409)
      }
    }
  } else if (property.type === 'activity' || property.type === 'trip') {
    const { data: slots } = await supabase
      .from('time_slots')
      .select('id')
      .eq('property_id', property.id)
      .eq('is_active', true)

    if (slots && slots.length > 0) {
      if (!input.time_slot_id) return json({ error: 'Please select a time slot.' }, 400)

      const { data: slotAvail } = await supabase
        .from('slot_availability')
        .select('available_spots')
        .eq('property_id', property.id)
        .eq('time_slot_id', input.time_slot_id)
        .eq('date', input.check_in)
        .maybeSingle()

      const spotsLeft = slotAvail ? slotAvail.available_spots : property.max_capacity ?? 99
      if (spotsLeft <= 0) return json({ error: 'This time slot is fully booked.' }, 409)
      if (input.guests_count > spotsLeft) {
        return json({ error: `Only ${spotsLeft} spot(s) left for this time slot.` }, 409)
      }
    }
  }

  // ── Find or invite the guest auth user ───────────────────────────────────
  const siteUrl = Deno.env.get('SITE_URL') ?? ''
  let guestUserId: string | null = null
  try {
    const { data: invite } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: siteUrl ? `${siteUrl}/my-bookings` : undefined,
      data: { full_name: input.guest_name.trim() },
    })
    guestUserId = invite?.user?.id ?? null
  } catch {
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    guestUserId = list?.users?.find((u) => u.email === email)?.id ?? null
  }

  // Compose notes — keep the "Time slot: …" line the email templates parse.
  const combinedNotes = [
    input.slot_label ? `Time slot: ${input.slot_label}` : '',
    input.notes ?? '',
  ]
    .filter(Boolean)
    .join('\n')

  // ── Insert the booking ───────────────────────────────────────────────────
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      property_id: input.property_id,
      owner_id: property.owner_id,
      guest_name: input.guest_name.trim(),
      guest_email: email,
      guest_phone: input.guest_phone || null,
      guests_count: input.guests_count,
      check_in: input.check_in,
      check_out: input.check_out || null,
      pickup_time: input.pickup_time || null,
      base_amount: input.base_amount ?? 0,
      status: 'pending',
      payment_method: 'cash',
      notes: combinedNotes || null,
      guest_user_id: guestUserId,
      variant_id: input.variant_id || null,
      room_id: assignedRoomId,
    })
    .select('id, booking_number')
    .single()

  if (error) return json({ error: error.message }, 400)

  const bookingNumber = String(booking.booking_number ?? '')

  // ── Notify guest + partner (best-effort) ─────────────────────────────────
  const isActivityType = property.type === 'activity' || property.type === 'trip'
  const dateFormatted = new Date(input.check_in).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  try {
    await sendMailWithTemplate({
      to: email,
      subject: bookingNumber
        ? `Booking request #${bookingNumber} received — ${property.name}`
        : `Booking request received — ${property.name}`,
      template: isActivityType ? 'activity pending' : 'trip pending',
      variables: {
        guestName: input.guest_name.trim(),
        bookingNumber,
        serviceName: property.name ?? 'Service',
        serviceType: property.type ?? '',
        date: dateFormatted,
        timeSlot: input.slot_label ?? '',
        location: property.location ?? '',
        island: property.island ?? '',
        guestsCount: String(input.guests_count),
        amount: formatIDR(input.base_amount ?? 0),
        notes: combinedNotes,
      },
    })
  } catch (err) {
    console.error('[create-booking] guest email failed:', err)
  }

  try {
    const { data: owner } = property.owner_id
      ? await supabase
          .from('profiles')
          .select('full_name, email, company_name')
          .eq('id', property.owner_id)
          .single()
      : { data: null }

    if (owner?.email) {
      await sendMailWithTemplate({
        to: owner.email,
        subject: bookingNumber
          ? `New booking request #${bookingNumber} — ${input.guest_name.trim()}`
          : `New booking request — ${input.guest_name.trim()}`,
        template: isActivityType ? 'activity pending - partner' : 'New booking arrived',
        variables: {
          partnerName: owner.company_name || owner.full_name || 'Partner',
          bookingNumber,
          serviceName: property.name ?? 'Service',
          serviceType: property.type ?? '',
          date: dateFormatted,
          timeSlot: input.slot_label ?? '',
          guestName: input.guest_name.trim(),
          guestEmail: email,
          guestPhone: input.guest_phone || '',
          guestsCount: String(input.guests_count),
          amount: formatIDR(input.base_amount ?? 0),
          location: property.location ?? '',
          island: property.island ?? '',
          notes: combinedNotes,
        },
      })
    }
  } catch (err) {
    console.error('[create-booking] partner email failed:', err)
  }

  return json({ success: true, booking_id: booking.id, booking_number: bookingNumber })
})
