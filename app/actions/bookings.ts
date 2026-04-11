'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { BookingStatus } from '@/lib/types'
import { autoAssignRoom } from './rooms'

export async function createBooking(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const checkOut   = formData.get('check_out') as string
  const variantId  = formData.get('variant_id') as string
  const propertyId = formData.get('property_id') as string
  const roomId     = (formData.get('room_id') as string) || null

  const { data: booking, error } = await supabase.from('bookings').insert({
    owner_id:          user.id,
    property_id:       propertyId,
    variant_id:        variantId || null,
    room_id:           roomId,
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
  }).select('id').single()

  if (error) return { error: error.message }

  // If no room was manually chosen, auto-assign
  if (booking && !roomId) {
    await autoAssignRoom(
      booking.id,
      propertyId,
      variantId || null,
      formData.get('check_in') as string,
      checkOut || null,
    )
  }

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard')
  revalidatePath(`/listings/${propertyId}`)
  redirect('/dashboard/bookings')
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const patch: Record<string, unknown> = { status }
  if (status === 'cancelled') patch.base_amount = 0

  const { error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  // ── Sync room status ──────────────────────────────────────────────────────
  // Fetch the booking's room_id to update room status
  const { data: booking } = await supabase
    .from('bookings')
    .select('room_id')
    .eq('id', id)
    .single()

  if (booking?.room_id) {
    let roomStatus: string | null = null
    if (status === 'checked_in')  roomStatus = 'occupied'
    if (status === 'completed')   roomStatus = 'needs_cleaning'
    if (status === 'cancelled')   roomStatus = 'available'

    if (roomStatus) {
      await supabase
        .from('rooms')
        .update({ status: roomStatus })
        .eq('id', booking.room_id)
        .eq('owner_id', user.id)
    }
  }

  revalidatePath('/dashboard/bookings')
  revalidatePath(`/dashboard/bookings/${id}`)
  revalidatePath('/dashboard/rooms')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBooking(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Free the room before deleting
  const { data: booking } = await supabase
    .from('bookings')
    .select('room_id')
    .eq('id', id)
    .single()

  if (booking?.room_id) {
    await supabase
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id)
      .eq('owner_id', user.id)
  }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard/rooms')
  revalidatePath('/dashboard')
  return { success: true }
}
