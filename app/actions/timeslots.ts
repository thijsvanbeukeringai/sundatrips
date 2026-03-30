'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTimeSlot(propertyId: string, startTime: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('time_slots').insert({
    property_id: propertyId,
    owner_id:    user.id,
    start_time:  startTime,
    sort_order:  parseInt(startTime.replace(':', '')), // sorts chronologically
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}

export async function removeTimeSlot(slotId: string, propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('time_slots')
    .delete()
    .eq('id', slotId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}

export async function updateTimeSlotDays(slotId: string, propertyId: string, daysOfWeek: number[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('time_slots')
    .update({ days_of_week: daysOfWeek })
    .eq('id', slotId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}

export async function toggleTimeSlot(slotId: string, propertyId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('time_slots')
    .update({ is_active: isActive })
    .eq('id', slotId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/availability`)
  return { success: true }
}
