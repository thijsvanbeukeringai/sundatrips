import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Room, Property, ListingVariant, Booking } from '@/lib/types'
import RoomsOverview from '@/components/dashboard/RoomsOverview'

type RoomWithRelations = Room & {
  variant:  ListingVariant | null
  property: Pick<Property, 'id' | 'name'> | null
}

type ActiveBooking = Pick<Booking, 'id' | 'room_id' | 'guest_name' | 'check_in' | 'check_out' | 'status'>

export default async function RoomsPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: rooms }, { data: activeBookings }] = await Promise.all([
    supabase
      .from('rooms')
      .select('*, variant:listing_variants(*), property:properties(id, name)')
      .eq('owner_id', user.id)
      .order('sort_order')
      .order('room_number')
      .returns<RoomWithRelations[]>(),

    // Active bookings with a room assigned
    supabase
      .from('bookings')
      .select('id, room_id, guest_name, check_in, check_out, status')
      .eq('owner_id', user.id)
      .in('status', ['confirmed', 'checked_in'])
      .not('room_id', 'is', null)
      .returns<ActiveBooking[]>(),
  ])

  return (
    <RoomsOverview
      rooms={(rooms ?? []) as RoomWithRelations[]}
      activeBookings={(activeBookings ?? []) as ActiveBooking[]}
    />
  )
}
