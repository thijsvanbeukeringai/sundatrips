'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
