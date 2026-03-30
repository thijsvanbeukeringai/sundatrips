'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface VariantData {
  name:           string
  description:    string
  price_per_unit: number
  price_unit:     string
  max_capacity:   number | null
  from_location:  string
  to_location:    string
  vehicle_type:   string
  driver_name:    string
  driver_phone:   string
  amenities:      string[]
  images:         string[]
}

export async function addVariant(propertyId: string, data: VariantData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('listing_variants').insert({
    property_id:    propertyId,
    owner_id:       user.id,
    name:           data.name,
    description:    data.description || null,
    price_per_unit: data.price_per_unit,
    price_unit:     data.price_unit,
    max_capacity:   data.max_capacity,
    from_location:  data.from_location || null,
    to_location:    data.to_location || null,
    vehicle_type:   data.vehicle_type || null,
    driver_name:    data.driver_name || null,
    driver_phone:   data.driver_phone || null,
    amenities:      data.amenities,
    images:         data.images ?? [],
  })
  if (error) throw error
  revalidatePath(`/dashboard/properties`)
  revalidatePath(`/listings/${propertyId}`)
}

export async function updateVariant(id: string, propertyId: string, data: Partial<VariantData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('listing_variants')
    .update({ ...data, description: data.description || null })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw error
  revalidatePath(`/dashboard/properties`)
  revalidatePath(`/listings/${propertyId}`)
}

export async function deleteVariant(id: string, propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('listing_variants')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw error
  revalidatePath(`/dashboard/properties`)
  revalidatePath(`/listings/${propertyId}`)
}

export async function toggleVariantActive(id: string, propertyId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('listing_variants')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw error
  revalidatePath(`/dashboard/properties`)
  revalidatePath(`/listings/${propertyId}`)
}

export async function reorderVariants(ids: string[], propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await Promise.all(
    ids.map((id, i) =>
      supabase
        .from('listing_variants')
        .update({ sort_order: i })
        .eq('id', id)
        .eq('owner_id', user.id)
    )
  )
  revalidatePath(`/dashboard/properties`)
}
