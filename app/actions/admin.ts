'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
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

// ── Impersonation ─────────────────────────────────────────────────────────────

interface AdminRestore {
  access_token: string
  refresh_token: string
  admin_name:   string
}

export async function startImpersonation(targetUserId: string): Promise<{ url?: string; error?: string }> {
  let supabase
  try { supabase = await requireAdmin() } catch { return { error: 'Unauthorized' } }

  const adminClient = createAdminClient()
  const cookieStore = await cookies()

  // Store current admin session so we can restore it later
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'No active session' }

  const { data: { user: adminUser } } = await supabase.auth.getUser()
  const { data: adminProfile } = await supabase.from('profiles').select('full_name').eq('id', adminUser!.id).single()

  cookieStore.set('admin_restore', JSON.stringify({
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    admin_name:    adminProfile?.full_name ?? 'Admin',
  } satisfies AdminRestore), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60, // 1 hour
    path:     '/',
  })

  // Get target user's email
  const { data: { user: targetUser }, error: getUserErr } = await adminClient.auth.admin.getUserById(targetUserId)
  if (getUserErr || !targetUser?.email) return { error: 'Target user not found' }

  // Generate a magic link — existing /auth/callback handles the implicit-flow hash
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { data, error } = await adminClient.auth.admin.generateLink({
    type:  'magiclink',
    email: targetUser.email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/dashboard&impersonate=1` },
  })

  if (error || !data.properties?.action_link) return { error: error?.message ?? 'Failed to generate link' }
  return { url: data.properties.action_link }
}

export async function stopImpersonation(): Promise<void> {
  const cookieStore = await cookies()
  const stored = cookieStore.get('admin_restore')
  if (!stored) { redirect('/dashboard'); return }

  const { access_token, refresh_token } = JSON.parse(stored.value) as AdminRestore

  const supabase = await createClient()
  await supabase.auth.signOut()
  await supabase.auth.setSession({ access_token, refresh_token })

  cookieStore.delete('admin_restore')
  redirect('/admin/users')
}
