import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Booking, Property } from '@/lib/types'
import BookingDetailClient from '@/components/dashboard/BookingDetailClient'

type FullBooking = Booking & { property: Property | null }

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('bookings')
    .select('*, property:properties(*)')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single<FullBooking>()

  if (!data) notFound()

  const { data: posItems } = await supabase
    .from('pos_items')
    .select('*')
    .eq('booking_id', data.id)
    .order('created_at', { ascending: true })

  return <BookingDetailClient booking={data} posItems={posItems ?? []} />
}
