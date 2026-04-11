import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { getCachedUser, getCachedProfile } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import type { Profile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const profile = await getCachedProfile() as Profile | null

  if (!profile) redirect('/login')

  // ── Crew access control ──────────────────────────────────────
  if (profile.role === 'crew') {
    const h = await headers()
    const path = h.get('x-pathname') ?? ''
    const perms = profile.crew_permissions ?? []

    const blocked =
      path.startsWith('/dashboard/properties') ||
      path.startsWith('/dashboard/financials') ||
      (path.startsWith('/dashboard/bookings') && !perms.includes('view_bookings')) ||
      (path === '/dashboard/pos/catalog' && !perms.includes('manage_catalog')) ||
      (path.startsWith('/dashboard/pos') && !perms.includes('manage_pos') && !perms.includes('manage_catalog'))

    if (blocked) redirect('/dashboard')
  }

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
        <Sidebar profile={profile} isImpersonating={!!impersonation} />
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
        <MobileNav profile={profile} isImpersonating={!!impersonation} />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
