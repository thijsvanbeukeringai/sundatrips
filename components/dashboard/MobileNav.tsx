'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Menu, X, LayoutDashboard, CalendarDays, ShoppingBag, Building2,
  BarChart3, Settings, LogOut, UserPlus, ChevronRight, Landmark, Users,
} from 'lucide-react'
import type { Profile } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

export default function MobileNav({ profile, isImpersonating }: { profile: Profile; isImpersonating?: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { t }    = useI18n()

  const isAdminMode = profile.role === 'admin' && !isImpersonating

  const navItems = isAdminMode
    ? [
        { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
        { href: '/admin/users',        icon: Users,           label: 'Users' },
        { href: '/admin/companies',    icon: Landmark,        label: 'Companies' },
        { href: '/admin/invite',       icon: UserPlus,        label: 'Invite Owner' },
        { href: '/dashboard/settings', icon: Settings,        label: t.dashboard.settings },
      ]
    : [
        { href: '/dashboard',            icon: LayoutDashboard, label: t.dashboard.overview },
        { href: '/dashboard/bookings',   icon: CalendarDays,    label: t.dashboard.bookings },
        { href: '/dashboard/pos',        icon: ShoppingBag,     label: t.dashboard.pos,     badge: 'Live' },
        { href: '/dashboard/properties', icon: Building2,       label: t.dashboard.listings },
        { href: '/dashboard/settings',   icon: Settings,        label: t.dashboard.settings },
      ]

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-jungle-900 border-b border-jungle-800 flex-shrink-0 z-30">
        <Image src="/logo.avif" alt="Sunda Trips" width={100} height={32} className="h-8 w-auto brightness-0 invert" priority />
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-jungle-900 z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-jungle-800">
          <Image src="/logo.avif" alt="Sunda Trips" width={100} height={32} className="h-8 w-auto brightness-0 invert" />
          <button onClick={() => setOpen(false)} className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-sunset-400' : 'text-white/50'}`} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="text-[10px] font-bold bg-sunset-500 text-white px-1.5 py-0.5 rounded-full">{badge}</span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
              </Link>
            )
          })}

          {profile.role === 'admin' && isImpersonating && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 pt-4 pb-1">{t.dashboard.admin}</p>
              {[
                { href: '/admin/users',     icon: Users,     label: 'Users' },
                { href: '/admin/companies', icon: Landmark,  label: 'Companies' },
                { href: '/admin/invite',    icon: UserPlus,  label: t.dashboard.inviteOwner },
                { href: '/admin',           icon: BarChart3, label: t.dashboard.adminOverview },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Icon className="w-5 h-5 flex-shrink-0 text-white/50" />
                  <span>{label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User + sign out */}
        <div className="p-4 border-t border-jungle-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-sunset-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-white/50 text-xs truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t.dashboard.signOut}
          </button>
        </div>
      </div>
    </>
  )
}
