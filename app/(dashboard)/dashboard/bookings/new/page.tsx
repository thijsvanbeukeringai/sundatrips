import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingForm from '@/components/dashboard/BookingForm'
import type { Property } from '@/lib/types'

export default async function NewBookingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('properties')
    .select('id, name, type, price_per_unit, price_unit')
    .eq('owner_id', user.id)
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-6 sm:p-8">
      <BookingForm properties={(data ?? []) as Pick<Property, 'id' | 'name' | 'type' | 'price_per_unit' | 'price_unit'>[]} />
    </div>
  )
}
