'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { BookingStatus } from '@/lib/types'

export async function createBooking(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const checkOut   = formData.get('check_out') as string
  const variantId  = formData.get('variant_id') as string

  const { error } = await supabase.from('bookings').insert({
    owner_id:          user.id,
    property_id:       formData.get('property_id') as string,
    variant_id:        variantId || null,
    guest_name:        formData.get('guest_name') as string,
    guest_email:       formData.get('guest_email') as string,
    guest_phone:       (formData.get('guest_phone') as string) || null,
    guest_nationality: (formData.get('guest_nationality') as string) || null,
    check_in:          formData.get('check_in') as string,
    check_out:         checkOut || null,
    guests_count:      parseInt(formData.get('guests_count') as string) || 1,
    base_amount:       parseFloat(formData.get('base_amount') as string),
    status:            (formData.get('status') as BookingStatus) || 'confirmed',
    payment_method:    (formData.get('payment_method') as string) || 'cash',
    notes:             (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }

  const propertyId = formData.get('property_id') as string
  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard')
  revalidatePath(`/listings/${propertyId}`)
  redirect('/dashboard/bookings')
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')
  revalidatePath(`/dashboard/bookings/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBooking(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard')
  return { success: true }
}
