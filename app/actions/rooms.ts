'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RoomStatus } from '@/lib/types'

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createRoom(data: {
  property_id: string
  variant_id:  string | null
  room_number: string
  name?:       string
  floor?:      number | null
  sort_order?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('rooms').insert({
    owner_id:    user.id,
    property_id: data.property_id,
    variant_id:  data.variant_id,
    room_number: data.room_number,
    name:        data.name || null,
    floor:       data.floor ?? null,
    sort_order:  data.sort_order ?? 0,
    status:      'available',
    is_active:   true,
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${data.property_id}/rooms`)
  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function updateRoom(id: string, propertyId: string, data: {
  room_number?: string
  name?:        string | null
  floor?:       number | null
  variant_id?:  string | null
  notes?:       string | null
  sort_order?:  number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('rooms')
    .update(data)
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/rooms`)
  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function updateRoomStatus(id: string, status: RoomStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('rooms')
    .update({ status })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/rooms')
  revalidatePath('/dashboard/bookings')
  return { success: true }
}

export async function toggleRoomActive(id: string, propertyId: string, is_active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('rooms')
    .update({ is_active })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/rooms`)
  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function deleteRoom(id: string, propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check for active bookings using this room
  const { data: active } = await supabase
    .from('bookings')
    .select('id')
    .eq('room_id', id)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .limit(1)

  if (active && active.length > 0)
    return { error: 'This room has active bookings and cannot be deleted.' }

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}/rooms`)
  revalidatePath('/dashboard/rooms')
  return { success: true }
}

// ─── Auto-assign ──────────────────────────────────────────────────────────────
// Find the best available room for a booking and assign it.
// Returns the assigned room_id, or null if none available.

export async function autoAssignRoom(
  bookingId:  string,
  propertyId: string,
  variantId:  string | null,
  checkIn:    string,
  checkOut:   string | null,
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Find all active rooms for this property (and variant if provided)
  let q = supabase
    .from('rooms')
    .select('id')
    .eq('property_id', propertyId)
    .eq('owner_id', user.id)
    .eq('is_active', true)
    .neq('status', 'maintenance')
    .order('sort_order', { ascending: true })
    .order('room_number', { ascending: true })

  if (variantId) q = q.eq('variant_id', variantId)

  const { data: rooms } = await q
  if (!rooms || rooms.length === 0) return null

  const roomIds = rooms.map(r => r.id)

  // Find which rooms are already booked for overlapping dates
  let conflictQuery = supabase
    .from('bookings')
    .select('room_id')
    .in('room_id', roomIds)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .neq('id', bookingId)          // exclude the current booking itself
    .lt('check_in', checkOut ?? '9999-12-31')

  if (checkOut) {
    conflictQuery = conflictQuery.or(`check_out.gt.${checkIn},check_out.is.null`)
  } else {
    conflictQuery = conflictQuery.or(`check_out.gte.${checkIn},check_out.is.null`)
  }

  const { data: conflicts } = await conflictQuery
  const conflictIds = new Set((conflicts ?? []).map(b => b.room_id))

  // Pick the first non-conflicting room
  const available = roomIds.find(id => !conflictIds.has(id))
  if (!available) return null

  // Assign it
  await supabase
    .from('bookings')
    .update({ room_id: available })
    .eq('id', bookingId)
    .eq('owner_id', user.id)

  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath('/dashboard/rooms')
  return available
}

// Manual reassign: assign a specific room to a booking
export async function assignRoomToBooking(bookingId: string, roomId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('bookings')
    .update({ room_id: roomId })
    .eq('id', bookingId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath('/dashboard/rooms')
  return { success: true }
}
