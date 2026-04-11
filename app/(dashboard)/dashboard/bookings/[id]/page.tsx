import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Booking, Property } from '@/lib/types'
import BookingDetailClient from '@/components/dashboard/BookingDetailClient'

type FullBooking = Booking & { property: Property | null }

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data } = await supabase
    .from('bookings')
    .select('*, property:properties(*)')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single<FullBooking>()

  if (!data) notFound()

  const [{ data: posItems }, { data: catalog }, { data: billPayments }] = await Promise.all([
    supabase
      .from('pos_items')
      .select('*')
      .eq('booking_id', data.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('pos_catalog')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('bill_payments')
      .select('total_amount')
      .eq('booking_id', data.id),
  ])

  const billPaymentTotal = (billPayments ?? []).reduce((s: number, p: { total_amount: number }) => s + p.total_amount, 0)
  const hasPayments = (billPayments ?? []).length > 0

  return (
    <BookingDetailClient
      booking={data}
      posItems={posItems ?? []}
      catalog={catalog ?? []}
      billPaymentTotal={billPaymentTotal}
      hasPayments={hasPayments}
    />
  )
}
