import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Booking, POSCatalogItem, Property } from '@/lib/types'
import POSTerminal from '@/components/dashboard/POSTerminal'

type BookingWithProperty = Booking & { property: Pick<Property, 'name' | 'type'> | null }

export default async function POSPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: bookings }, { data: catalog }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, property:properties(name, type)')
      .eq('owner_id', user.id)
      .in('status', ['confirmed', 'checked_in'])
      .order('check_in', { ascending: true })
      .returns<BookingWithProperty[]>(),

    supabase
      .from('pos_catalog')
      .select('*')
      .eq('owner_id', user.id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ])

  return (
    <POSTerminal
      initialBookings={(bookings ?? []) as BookingWithProperty[]}
      initialCatalog={(catalog ?? []) as POSCatalogItem[]}
      userId={user.id}
    />
  )
}
