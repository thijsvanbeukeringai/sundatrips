'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ListingVariant } from '@/lib/types'

/**
 * Returns available variants (full objects) for the given date range and guest count.
 *
 * If the property has physical rooms set up:
 *   A variant is available if it has at least one room with no conflicting booking.
 *
 * If no rooms exist (legacy / non-stay properties):
 *   Falls back to variant-level conflict check (one booking per variant at a time).
 */
export async function getAvailableVariants(
  propertyId: string,
  checkIn:    string,
  checkOut:   string,
  guests:     number,
): Promise<ListingVariant[]> {
  const supabase = await createClient()

  const { data: variants } = await supabase
    .from('listing_variants')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('sort_order')

  if (!variants || variants.length === 0) return []

  const capacityFiltered = variants.filter(
    (v: ListingVariant) => !v.max_capacity || v.max_capacity >= guests
  )
  if (capacityFiltered.length === 0) return []

  const variantIds = capacityFiltered.map((v: ListingVariant) => v.id)

  // ── Check if this property has rooms ──────────────────────────────────────
  const { data: allRooms } = await supabase
    .from('rooms')
    .select('id, variant_id')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .neq('status', 'maintenance')

  if (allRooms && allRooms.length > 0) {
    // ── Room-based availability ────────────────────────────────────────────
    // For each room, check if it has a conflicting booking
    const roomIds = allRooms.map(r => r.id)

    const { data: conflicts } = await supabase
      .from('bookings')
      .select('room_id')
      .in('room_id', roomIds)
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .lt('check_in', checkOut)
      .or(`check_out.gt.${checkIn},check_out.is.null`)

    const bookedRoomIds = new Set((conflicts ?? []).map(b => b.room_id))

    // A variant is available if it has at least one room that is NOT booked
    return capacityFiltered.filter(v => {
      const variantRooms = allRooms.filter(r => r.variant_id === v.id)
      if (variantRooms.length === 0) return false  // variant has no rooms = not bookable
      return variantRooms.some(r => !bookedRoomIds.has(r.id))
    })
  }

  // ── Legacy: no rooms — one booking per variant ─────────────────────────
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('variant_id')
    .eq('property_id', propertyId)
    .in('variant_id', variantIds)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .lt('check_in', checkOut)
    .or(`check_out.gt.${checkIn},check_out.is.null`)

  const conflictIds = new Set((conflicts ?? []).map((b: { variant_id: string }) => b.variant_id))

  return capacityFiltered.filter((v: ListingVariant) => !conflictIds.has(v.id))
}

// ─── Available rooms for booking form ────────────────────────────────────────

export type AvailableVariant = {
  id:             string
  name:           string
  price_per_unit: number
  price_unit:     string
  max_capacity:   number | null
  rooms:          { id: string; room_number: string; name: string | null; floor: number | null }[]
}

export async function getAvailableRoomsForBooking(
  propertyId: string,
  checkIn:    string,
  checkOut:   string,
): Promise<AvailableVariant[]> {
  const supabase = await createClient()

  const { data: variants } = await supabase
    .from('listing_variants')
    .select('id, name, price_per_unit, price_unit, max_capacity')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('sort_order')

  if (!variants || variants.length === 0) return []

  const { data: allRooms } = await supabase
    .from('rooms')
    .select('id, variant_id, room_number, name, floor')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .neq('status', 'maintenance')
    .order('sort_order')
    .order('room_number')

  if (!allRooms || allRooms.length === 0) return []

  const roomIds = allRooms.map(r => r.id)

  // Find booked rooms in the date range
  let conflictQuery = supabase
    .from('bookings')
    .select('room_id')
    .in('room_id', roomIds)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .lt('check_in', checkOut)

  conflictQuery = conflictQuery.or(`check_out.gt.${checkIn},check_out.is.null`)

  const { data: conflicts } = await conflictQuery
  const bookedRoomIds = new Set((conflicts ?? []).map(b => b.room_id))

  return variants
    .map(v => {
      const availableRooms = allRooms
        .filter(r => r.variant_id === v.id && !bookedRoomIds.has(r.id))
        .map(r => ({ id: r.id, room_number: r.room_number, name: r.name, floor: r.floor }))
      return { ...v, rooms: availableRooms }
    })
    .filter(v => v.rooms.length > 0)
}

export async function setAvailability(
  propertyId: string,
  date: string,
  opts: { is_blocked?: boolean; available_spots?: number | null; note?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('availability')
    .upsert({
      property_id:     propertyId,
      owner_id:        user.id,
      date,
      is_blocked:      opts.is_blocked ?? false,
      available_spots: opts.available_spots ?? null,
      note:            opts.note ?? null,
    }, { onConflict: 'property_id,date' })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}

export async function setSlotAvailability(
  propertyId: string,
  slotId: string,
  date: string,
  spots: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('slot_availability')
    .upsert({
      property_id:     propertyId,
      owner_id:        user.id,
      time_slot_id:    slotId,
      date,
      available_spots: spots,
    }, { onConflict: 'time_slot_id,date' })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}

export async function clearSlotAvailability(propertyId: string, slotId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('slot_availability')
    .delete()
    .eq('time_slot_id', slotId)
    .eq('date', date)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}

export async function clearAvailability(propertyId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('property_id', propertyId)
    .eq('date', date)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}
