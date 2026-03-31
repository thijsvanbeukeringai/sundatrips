import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Booking } from '@/lib/types'
import BookingsPageClient from '@/components/dashboard/BookingsPageClient'

type BookingWithProperty = Booking & { property: { name: string; type: string } | null }

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select('*, property:properties(name, type)')
    .eq('owner_id', user.id)
    .order('check_in', { ascending: false })

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  // Push text search to DB instead of filtering in JS
  if (searchParams.q) {
    query = query.or(`guest_name.ilike.%${searchParams.q}%,guest_email.ilike.%${searchParams.q}%`)
  }

  // Run both queries in parallel instead of sequentially
  const [{ data }, { data: allBookings }] = await Promise.all([
    query.returns<BookingWithProperty[]>(),
    supabase.from('bookings').select('status').eq('owner_id', user.id),
  ])

  const bookings = data ?? []

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
