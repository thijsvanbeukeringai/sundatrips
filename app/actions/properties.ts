'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function parseImages(raw: string): string[] {
  return raw.split('\n').map(s => s.trim()).filter(Boolean)
}
function parseAmenities(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export async function createProperty(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('properties').insert({
    owner_id:      user.id,
    name:          formData.get('name') as string,
    type:          formData.get('type') as string,
    island:        formData.get('island') as string,
    location:      formData.get('location') as string,
    description:   (formData.get('description') as string) || null,
    tag:           (formData.get('tag') as string) || null,
    price_per_unit: parseFloat(formData.get('price_per_unit') as string),
    price_unit:    formData.get('price_unit') as string,
    max_capacity:  formData.get('max_capacity') ? parseInt(formData.get('max_capacity') as string) : null,
    duration:       (formData.get('duration') as string) || null,
    duration_hours: formData.get('duration_hours') ? parseFloat(formData.get('duration_hours') as string) : null,
    images:           parseImages(formData.get('images') as string),
    amenities:        parseAmenities(formData.get('amenities') as string),
    is_active:        formData.get('is_active') === 'on',
    transfer_from:    (formData.get('transfer_from') as string) || null,
    transfer_to:      (formData.get('transfer_to') as string) || null,
    distance_km:      formData.get('distance_km') ? parseFloat(formData.get('distance_km') as string) : null,
    english_speaking:  formData.get('english_speaking') === 'on',
    driver_name:       (formData.get('driver_name') as string) || null,
    driver_phone:      (formData.get('driver_phone') as string) || null,
    venue_id:          (formData.get('venue_id') as string) || null,
    price_per_km:      formData.get('price_per_km') ? parseFloat(formData.get('price_per_km') as string) : null,
    pickup_available:        formData.get('pickup_available') === 'on',
    private_tour_available:  formData.get('private_tour_available') === 'on',
    private_tour_price:      formData.get('private_tour_price') ? parseFloat(formData.get('private_tour_price') as string) : null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/properties')
  revalidatePath('/')
  redirect('/dashboard/properties')
}

export async function updateProperty(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('properties')
    .update({
      name:          formData.get('name') as string,
      type:          formData.get('type') as string,
      island:        formData.get('island') as string,
      location:      formData.get('location') as string,
      description:   (formData.get('description') as string) || null,
      tag:           (formData.get('tag') as string) || null,
      price_per_unit: parseFloat(formData.get('price_per_unit') as string),
      price_unit:    formData.get('price_unit') as string,
      max_capacity:  formData.get('max_capacity') ? parseInt(formData.get('max_capacity') as string) : null,
      duration:       (formData.get('duration') as string) || null,
      duration_hours: formData.get('duration_hours') ? parseFloat(formData.get('duration_hours') as string) : null,
      images:           parseImages(formData.get('images') as string),
      amenities:        parseAmenities(formData.get('amenities') as string),
      is_active:        formData.get('is_active') === 'on',
      transfer_from:    (formData.get('transfer_from') as string) || null,
      transfer_to:      (formData.get('transfer_to') as string) || null,
      distance_km:      formData.get('distance_km') ? parseFloat(formData.get('distance_km') as string) : null,
      english_speaking:  formData.get('english_speaking') === 'on',
      driver_name:       (formData.get('driver_name') as string) || null,
      driver_phone:      (formData.get('driver_phone') as string) || null,
      price_per_km:      formData.get('price_per_km') ? parseFloat(formData.get('price_per_km') as string) : null,
      pickup_available:        formData.get('pickup_available') === 'on',
      private_tour_available:  formData.get('private_tour_available') === 'on',
      private_tour_price:      formData.get('private_tour_price') ? parseFloat(formData.get('private_tour_price') as string) : null,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/properties')
  revalidatePath('/')
  redirect('/dashboard/properties')
}

export async function deleteProperty(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/properties')
  revalidatePath('/')
  return { success: true }
}

export async function togglePropertyActive(id: string, is_active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('properties')
    .update({ is_active })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/properties')
  revalidatePath('/')
  return { success: true }
}
