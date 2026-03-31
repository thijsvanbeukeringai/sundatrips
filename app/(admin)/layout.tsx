import { redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

// Admin-only route group — middleware already checks role,
// but we double-check here so the layout is self-contained.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single<Profile>()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return <>{children}</>
}
