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
