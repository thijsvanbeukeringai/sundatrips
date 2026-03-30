'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PropertyType } from '@/lib/types'

function parseImages(raw: string): string[] {
  return raw.split('\n').map(s => s.trim()).filter(Boolean)
}
function parseAmenities(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export async function createVenue(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return { error: 'Profile not found' }

  // Admin can create for any owner; owner creates for themselves
  const ownerId = profile.role === 'admin'
    ? (formData.get('owner_id') as string) || user.id
    : user.id

  const allowedTypesRaw = formData.getAll('allowed_types') as string[]
  const allowedTypes = allowedTypesRaw.length > 0 ? allowedTypesRaw : ['stay', 'trip', 'activity', 'transfer']

  const { error } = await supabase.from('venues').insert({
    owner_id:      ownerId,
    name:          formData.get('name') as string,
    description:   (formData.get('description') as string) || null,
    location:      formData.get('location') as string,
    island:        formData.get('island') as string,
    images:        parseImages(formData.get('images') as string ?? ''),
    amenities:     parseAmenities(formData.get('amenities') as string ?? ''),
    allowed_types: allowedTypes,
    is_active:     formData.get('is_active') === 'on',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/venues')
  revalidatePath('/admin/companies')
  redirect('/dashboard/venues')
}

export async function updateVenue(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const allowedTypesRaw = formData.getAll('allowed_types') as string[]
  const allowedTypes = allowedTypesRaw.length > 0 ? allowedTypesRaw : ['stay', 'trip', 'activity', 'transfer']

  const updateData = {
    name:          formData.get('name') as string,
    description:   (formData.get('description') as string) || null,
    location:      formData.get('location') as string,
    island:        formData.get('island') as string,
    images:        parseImages(formData.get('images') as string ?? ''),
    amenities:     parseAmenities(formData.get('amenities') as string ?? ''),
    allowed_types: allowedTypes,
    is_active:     formData.get('is_active') === 'on',
  }

  let query = supabase.from('venues').update(updateData).eq('id', id)
  if (profile?.role !== 'admin') query = query.eq('owner_id', user.id)

  const { error } = await query

  if (error) return { error: error.message }

  revalidatePath('/dashboard/venues')
  revalidatePath(`/dashboard/venues/${id}`)
  revalidatePath('/admin/companies')
  redirect(`/dashboard/venues/${id}`)
}

export async function deleteVenue(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  let query = supabase.from('venues').delete().eq('id', id)
  if (profile?.role !== 'admin') query = query.eq('owner_id', user.id)

  const { error } = await query
  if (error) return { error: error.message }

  revalidatePath('/dashboard/venues')
  revalidatePath('/admin/companies')
  return { success: true }
}

// Admin: create a venue for a specific owner
export async function adminCreateVenueForOwner(ownerEmail: string, venueName: string, allowedTypes: PropertyType[]) {
  const admin = createAdminClient()

  // Find owner profile by email
  const { data: { users } } = await admin.auth.admin.listUsers()
  const ownerUser = users.find(u => u.email === ownerEmail)
  if (!ownerUser) return { error: 'Owner not found' }

  const supabase = await createClient()
  const { error } = await supabase.from('venues').insert({
    owner_id:      ownerUser.id,
    name:          venueName,
    location:      '',
    island:        'Lombok',
    allowed_types: allowedTypes,
    is_active:     true,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/companies')
  return { success: true }
}

export async function assignPropertyToVenue(propertyId: string, venueId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  let query = supabase.from('properties').update({ venue_id: venueId }).eq('id', propertyId)
  if (profile?.role !== 'admin') query = query.eq('owner_id', user.id)

  const { error } = await query
  if (error) return { error: error.message }

  revalidatePath('/admin/companies')
  revalidatePath('/dashboard/venues')
  revalidatePath('/dashboard/properties')
  return { success: true }
}
