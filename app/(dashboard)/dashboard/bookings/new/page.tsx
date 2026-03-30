import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingForm from '@/components/dashboard/BookingForm'
import type { Property, ListingVariant } from '@/lib/types'

export default async function NewBookingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: properties }, { data: variants }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, type, price_per_unit, price_unit')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('listing_variants')
      .select('id, property_id, name, price_per_unit, price_unit, max_capacity, is_active')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('sort_order'),
  ])

  return (
    <div className="p-6 sm:p-8">
      <BookingForm
        properties={(properties ?? []) as Pick<Property, 'id' | 'name' | 'type' | 'price_per_unit' | 'price_unit'>[]}
        variants={(variants ?? []) as Pick<ListingVariant, 'id' | 'property_id' | 'name' | 'price_per_unit' | 'price_unit' | 'max_capacity'>[]}
      />
    </div>
  )
}
