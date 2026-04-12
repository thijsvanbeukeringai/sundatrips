'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  full_name: string
  phone: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name.trim(),
      phone:     data.phone.trim() || null,
    })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/dashboard/settings')
}

export async function updatePartnerProfile(data: {
  full_name:           string
  phone:               string
  company_name:        string
  company_description: string
  company_logo:        string
  company_location:    string
  company_island:      string
  languages:           string[]
  amenities:           string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name:           data.full_name.trim(),
      phone:               data.phone.trim() || null,
      company_name:        data.company_name.trim() || null,
      company_description: data.company_description.trim() || null,
      company_logo:        data.company_logo.trim() || null,
      company_location:    data.company_location.trim() || null,
      company_island:      data.company_island.trim() || null,
      languages:           data.languages.filter(Boolean),
      amenities:           data.amenities.filter(Boolean),
    })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/portal/settings')
  revalidatePath('/portal')
}
