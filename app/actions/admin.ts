'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { AllowedPaymentMethods } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function setOwnerAllowedTypes(
  ownerId: string,
  types: string[]
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('profiles')
    .update({ allowed_listing_types: types })
    .eq('id', ownerId)
  if (error) throw error
  revalidatePath('/dashboard/admin/owners')
}

export async function updateOwnerStripe(
  ownerId: string,
  data: {
    stripe_account_id?:     string | null
    stripe_onboarding_done?: boolean
    stripe_charges_enabled?: boolean
  }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', ownerId)
  if (error) throw error
  revalidatePath('/dashboard/admin/owners')
}

export async function setOwnerPaymentMethods(
  ownerId: string,
  methods: AllowedPaymentMethods
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('profiles')
    .update({ allowed_payment_methods: methods })
    .eq('id', ownerId)
  if (error) throw error
  revalidatePath('/dashboard/admin/owners')
}

export async function sendPasswordReset(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }

  const admin = createAdminClient()
  // Get the target user's email
  const { data: targetUser, error: fetchError } = await admin.auth.admin.getUserById(userId)
  if (fetchError || !targetUser.user.email) return { error: 'User not found' }

  const { error } = await supabase.auth.resetPasswordForEmail(targetUser.user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard/settings`,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserProfile(
  userId: string,
  data: { full_name: string; role: 'owner' | 'admin' }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  if (userId === user.id) return { error: 'Cannot edit your own account here' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: data.full_name, role: data.role })
    .eq('id', userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteOwner(ownerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Can't delete yourself
  if (ownerId === user.id) return { error: 'Cannot delete your own account' }

  // Must be admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }

  // Delete the auth user via admin client — cascades to profiles + their data
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(ownerId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/owners')
  return { success: true }
}
