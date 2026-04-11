'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { CrewPermission } from '@/lib/types'

const VALID_PERMISSIONS: CrewPermission[] = [
  'view_bookings',
  'manage_pos',
  'check_in_guests',
  'view_financials',
  'manage_catalog',
]

export async function inviteCrewMember(data: {
  email: string
  fullName: string
  permissions: CrewPermission[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'owner') return { error: 'Only owners can invite crew members' }

  if (!data.email || !data.fullName) return { error: 'Email and name are required' }

  const safePerms = data.permissions.filter(p => VALID_PERMISSIONS.includes(p))

  const admin = createAdminClient()
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(data.email, {
    data: {
      full_name:        data.fullName,
      role:             'crew',
      owner_id:         user.id,
      crew_permissions: safePerms,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
  })

  if (inviteError) return { error: inviteError.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateCrewPermissions(crewId: string, permissions: CrewPermission[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const safePerms = permissions.filter(p => VALID_PERMISSIONS.includes(p))

  const { data: crew } = await supabase
    .from('profiles').select('owner_id, role').eq('id', crewId).single()

  if (crew?.owner_id !== user.id || crew?.role !== 'crew') return { error: 'Not authorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ crew_permissions: safePerms })
    .eq('id', crewId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function removeCrewMember(crewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: crew } = await supabase
    .from('profiles').select('owner_id, role').eq('id', crewId).single()

  if (crew?.owner_id !== user.id || crew?.role !== 'crew') return { error: 'Not authorized' }

  // Revoke access: clear owner link and all permissions
  const { error } = await supabase
    .from('profiles')
    .update({ owner_id: null, crew_permissions: [] })
    .eq('id', crewId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}
