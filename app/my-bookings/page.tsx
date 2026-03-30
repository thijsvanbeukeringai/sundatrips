import { createClient } from '@/lib/supabase/server'
import type { Booking, ListingVariant, Property } from '@/lib/types'
import MyBookingsClient from '@/components/MyBookingsClient'
import GuestLoginForm from '@/components/GuestLoginForm'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — show magic link form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar solid />
        <GuestLoginForm />
        <Footer />
      </div>
    )
  }

  // Fetch bookings for this guest (RLS: guest_email = auth.email())
  const { data: rows } = await supabase
    .from('bookings')
    .select('*, property:properties(*), variant:listing_variants(*)')
    .eq('guest_email', user.email!)
    .order('created_at', { ascending: false })

  const bookings = (rows ?? []) as (Booking & { property: Property; variant: ListingVariant | null })[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar solid />
      <MyBookingsClient bookings={bookings} />
      <Footer />
    </div>
  )
}
