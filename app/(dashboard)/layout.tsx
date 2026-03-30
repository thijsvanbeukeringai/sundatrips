import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar profile={profile} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-jungle-900 border-b border-jungle-800 flex-shrink-0">
          <span className="font-display font-bold text-white">Sunda Trips</span>
          <div className="w-8 h-8 rounded-full bg-sunset-500 flex items-center justify-center text-white text-sm font-bold">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
