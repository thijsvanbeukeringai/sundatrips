import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Booking } from '@/lib/types'
import BookingsPageClient from '@/components/dashboard/BookingsPageClient'

type BookingWithProperty = Booking & { property: { name: string; type: string } | null }

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('bookings')
    .select('*, property:properties(name, type)')
    .eq('owner_id', user.id)
    .order('check_in', { ascending: false })

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  const { data } = await query.returns<BookingWithProperty[]>()
  let bookings = (data ?? [])

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    bookings = bookings.filter(
      b => b.guest_name.toLowerCase().includes(q) || b.guest_email.toLowerCase().includes(q)
    )
  }

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('status')
    .eq('owner_id', user.id)

  const counts = (allBookings ?? []).reduce<Record<string, number>>((acc, b) => {
    acc.all = (acc.all ?? 0) + 1
    acc[b.status] = (acc[b.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <BookingsPageClient
      bookings={bookings as any}
      counts={counts}
      currentStatus={searchParams.status ?? 'all'}
      q={searchParams.q ?? ''}
    />
  )
}
