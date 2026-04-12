import { redirect } from 'next/navigation'
import { getCachedUser, getCachedProfile } from '@/lib/supabase/server'
import PortalNav from '@/components/portal/PortalNav'
import type { Profile } from '@/lib/types'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user    = await getCachedUser()
  if (!user) redirect('/login')

  const profile = await getCachedProfile() as Profile | null
  if (!profile) redirect('/login')
  if (profile.role !== 'partner') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <PortalNav profile={profile} />

      {/* Content — offset for mobile top bar + bottom tabs */}
      <main className="flex-1 pt-14 pb-24 lg:pt-0 lg:pb-0 lg:overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
