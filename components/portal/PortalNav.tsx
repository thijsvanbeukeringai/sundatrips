'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, List, Users, PlusCircle, LogOut, Compass, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'

const NAV = [
  { href: '/portal',              label: 'Upcoming',  icon: CalendarDays },
  { href: '/portal/bookings',     label: 'Bookings',  icon: List         },
  { href: '/portal/services',     label: 'Services',  icon: Briefcase    },
  { href: '/portal/customers',    label: 'Customers', icon: Users        },
  { href: '/portal/bookings/new', label: 'New',       icon: PlusCircle   },
]

function isActive(href: string, pathname: string) {
  if (href === '/portal') return pathname === '/portal'
  return pathname.startsWith(href)
}

export default function PortalNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 h-screen sticky top-0 flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-jungle-800 rounded-xl flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-jungle-800 text-sm leading-tight">Sunda Trips</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Partner Portal</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-jungle-50 text-jungle-800'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-jungle-700' : 'text-gray-400'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Profile + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-jungle-100 flex items-center justify-center text-jungle-700 font-bold text-sm">
              {profile.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-[11px] text-gray-400 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-jungle-800 rounded-lg flex items-center justify-center">
            <Compass className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-jungle-800 text-sm">Partner Portal</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-jungle-100 flex items-center justify-center text-jungle-700 font-bold text-sm">
          {profile.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
                active ? 'text-jungle-700' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-jungle-700' : 'text-gray-400'}`} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
