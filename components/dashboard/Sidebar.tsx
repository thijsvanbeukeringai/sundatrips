'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, ShoppingBag, Building2,
  BarChart3, Settings, LogOut, ChevronRight, UserPlus,
  Pencil, Check, X, Landmark, Users,
} from 'lucide-react'
import type { Profile } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { updateProfile } from '@/app/actions/profile'

export default function Sidebar({ profile, isImpersonating }: { profile: Profile; isImpersonating?: boolean }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { t, lang, setLang } = useI18n()

  const [editOpen, setEditOpen]   = useState(false)
  const [name,     setName]       = useState(profile.full_name)
  const [saved,    setSaved]      = useState(false)
  const [pending,  startTransition] = useTransition()

  function openEdit() { setName(profile.full_name); setEditOpen(true) }
  function closeEdit() { setEditOpen(false); setSaved(false) }

  function save() {
    startTransition(async () => {
      await updateProfile({ full_name: name, phone: profile.phone ?? '' })
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditOpen(false) }, 1200)
    })
  }

  const isAdminMode = profile.role === 'admin' && !isImpersonating
  const isCrewMode  = profile.role === 'crew'
  const crewPerms   = profile.crew_permissions ?? []

  const navItems = isAdminMode
    ? [
        { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
        { href: '/admin/users',        icon: Users,           label: 'Users' },
        { href: '/admin/companies',    icon: Landmark,        label: 'Companies' },
        { href: '/admin/invite',       icon: UserPlus,        label: 'Invite Owner' },
        { href: '/dashboard/settings', icon: Settings,        label: t.dashboard.settings },
      ]
    : isCrewMode
    ? [
        ...(crewPerms.includes('view_bookings')  ? [{ href: '/dashboard/bookings', icon: CalendarDays, label: t.dashboard.bookings }] : []),
        ...(crewPerms.includes('manage_pos')     ? [{ href: '/dashboard/pos',      icon: ShoppingBag,  label: t.dashboard.pos, badge: 'Live' as const }] : []),
        ...(crewPerms.includes('manage_catalog') && !crewPerms.includes('manage_pos')
          ? [{ href: '/dashboard/pos/catalog',   icon: ShoppingBag,  label: 'POS Catalog' }] : []),
        { href: '/dashboard/settings', icon: Settings, label: t.dashboard.settings },
      ]
    : [
        { href: '/dashboard',             icon: LayoutDashboard, label: t.dashboard.overview },
        { href: '/dashboard/bookings',    icon: CalendarDays,    label: t.dashboard.bookings },
        { href: '/dashboard/pos',         icon: ShoppingBag,     label: t.dashboard.pos,      badge: 'Live' as const },
        { href: '/dashboard/properties',  icon: Building2,       label: t.dashboard.listings },
        { href: '/dashboard/financials',  icon: BarChart3,       label: t.dashboard.financials },
        { href: '/dashboard/settings',    icon: Settings,        label: t.dashboard.settings },
      ]

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 h-full bg-jungle-900 border-r border-jungle-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-jungle-800">
        <Image
          src="/logo.avif"
          alt="Sunda Trips"
          width={120}
          height={36}
          className="h-9 w-auto brightness-0 invert"
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-sunset-400' : 'text-white/50 group-hover:text-white'}`} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-bold bg-sunset-500 text-white px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
            </Link>
          )
        })}
      </nav>

      {/* Admin links (only shown for admin viewing as owner via impersonation) */}
      {profile.role === 'admin' && isImpersonating && (
        <div className="px-3 pb-4 border-t border-white/10 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 px-3 mb-2">{t.dashboard.admin}</p>
          {[
            { href: '/admin/users',            icon: Users,     label: 'Users' },
            { href: '/admin/companies',        icon: Landmark,  label: 'Companies' },
            { href: '/admin/invite',           icon: UserPlus,  label: t.dashboard.inviteOwner },
            { href: '/admin',                  icon: BarChart3, label: t.dashboard.adminOverview },
          ].map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-white/60 group-hover:text-white" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* User profile + sign out */}
      <div className="p-4 border-t border-jungle-800">

        {/* Inline edit panel */}
        {editOpen && (
          <div className="mb-3 bg-jungle-700/40 rounded-xl p-3 space-y-3">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">{t.settings.editProfile}</p>

            {/* Name */}
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">{t.settings.fullName}</p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-jungle-900/50 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-white/30 placeholder-white/30"
              />
            </div>

            {/* Language */}
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">{t.settings.language ?? 'Language'}</p>
              <div className="flex gap-2">
                {(['en', 'id'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors ${
                      lang === l
                        ? 'bg-sunset-500 text-white'
                        : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    {l === 'en' ? '🇬🇧 EN' : '🇮🇩 ID'}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={save}
                disabled={pending || !name.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-jungle-600 hover:bg-jungle-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                {pending ? t.settings.saving : saved ? t.settings.saved : t.settings.save}
              </button>
              <button
                onClick={closeEdit}
                className="px-3 py-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* User row */}
        <button
          onClick={editOpen ? closeEdit : openEdit}
          className="w-full flex items-center gap-3 px-2 mb-3 rounded-xl hover:bg-white/5 py-1.5 transition-colors group text-left"
        >
          <div className="w-8 h-8 rounded-full bg-sunset-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{name}</p>
            <p className="text-white/60 text-xs truncate">{profile.email}</p>
          </div>
          <Pencil className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors" />
        </button>

        <div className="flex items-center justify-between gap-2 mb-1">
          <LanguageSwitcher dark />
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t.dashboard.signOut}
          </button>
        </div>
      </div>
    </aside>
  )
}
