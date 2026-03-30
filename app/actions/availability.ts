'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Returns variant IDs that are available for the given date range and guest count.
 * A variant is unavailable if it has an active booking overlapping the dates,
 * or if its max_capacity is less than the requested guest count.
 */
export async function getAvailableVariantIds(
  propertyId: string,
  checkIn:    string,
  checkOut:   string,
  guests:     number,
): Promise<string[]> {
  const supabase = await createClient()

  const { data: variants } = await supabase
    .from('listing_variants')
    .select('id, max_capacity')
    .eq('property_id', propertyId)
    .eq('is_active', true)

  if (!variants || variants.length === 0) return []

  const capacityFiltered = variants.filter(
    v => !v.max_capacity || v.max_capacity >= guests
  )
  if (capacityFiltered.length === 0) return []

  const variantIds = capacityFiltered.map(v => v.id)

  // A booking overlaps if: check_in < searchCheckOut AND (check_out > searchCheckIn OR check_out IS NULL)
  // NULL check_out means single-day booking — block if check_in falls within the search range
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('variant_id')
    .eq('property_id', propertyId)
    .in('variant_id', variantIds)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .lt('check_in', checkOut)
    .or(`check_out.gt.${checkIn},check_out.is.null`)

  const conflictIds = new Set((conflicts ?? []).map((b: { variant_id: string }) => b.variant_id))

  return variantIds.filter(id => !conflictIds.has(id))
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
