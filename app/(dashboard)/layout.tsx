import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import type { Profile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  // Detect admin impersonation
  const cookieStore = await cookies()
  const adminRestore = cookieStore.get('admin_restore')
  const impersonation = adminRestore
    ? JSON.parse(adminRestore.value) as { admin_name: string }
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar profile={profile} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Impersonation banner */}
        {impersonation && (
          <ImpersonationBanner
            adminName={impersonation.admin_name}
            targetName={profile.full_name ?? user.email ?? 'User'}
          />
        )}

        {/* Mobile nav */}
        <MobileNav profile={profile} />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
