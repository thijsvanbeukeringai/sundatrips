import { createClient, getCachedUser, getCachedProfile } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Booking, Profile } from '@/lib/types'
import DashboardOverviewClient from '@/components/dashboard/DashboardOverviewClient'
import AdminDashboardClient from '@/components/dashboard/AdminDashboardClient'

export default async function DashboardPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const profile = await getCachedProfile() as Profile | null

  const supabase = await createClient()

  // Check if admin is currently impersonating someone
  const cookieStore = await cookies()
  const adminRestoreCookie = cookieStore.get('admin_restore')
  const isImpersonating = !!adminRestoreCookie

  // Crew member → redirect to first permitted page
  if (profile?.role === 'crew') {
    const perms = profile.crew_permissions ?? []
    if (perms.includes('view_bookings')) redirect('/dashboard/bookings')
    if (perms.includes('manage_pos')) redirect('/dashboard/pos')
    redirect('/dashboard/settings')
  }

  // Admin in their own account → show admin overview
  if (profile?.role === 'admin' && !isImpersonating) {
    const [
      { data: profiles },
      { data: properties },
      { data: rawBookings },
      { data: venues },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, owner_id'),
      supabase.from('bookings')
        .select('id, guest_name, total_amount, platform_fee, status, check_in, property:properties(name, venue_id)')
        .order('check_in', { ascending: false })
        .limit(300),
      supabase.from('venues').select('id, name').order('name'),
    ])

    const venueMap = Object.fromEntries((venues ?? []).map(v => [v.id, v.name]))
    const listingCounts = Object.fromEntries(
      (profiles ?? []).map(p => [p.id, (properties ?? []).filter(pr => pr.owner_id === p.id).length])
    )

    const adminProfiles = (profiles ?? []).map(p => ({
      id:            p.id,
      full_name:     p.full_name ?? '',
      email:         p.email ?? '',
      role:          p.role,
      created_at:    p.created_at,
      listing_count: listingCounts[p.id] ?? 0,
    }))

    const adminBookings = (rawBookings ?? []).map((b: any) => ({
      id:            b.id,
      guest_name:    b.guest_name,
      total_amount:  b.total_amount,
      platform_fee:  b.platform_fee,
      status:        b.status,
      check_in:      b.check_in,
      property_name: b.property?.name ?? '—',
      venue_id:      b.property?.venue_id ?? null,
      venue_name:    b.property?.venue_id ? (venueMap[b.property.venue_id] ?? null) : null,
    }))

    return (
      <AdminDashboardClient
        profiles={adminProfiles}
        bookings={adminBookings}
        venues={venues ?? []}
      />
    )
  }

  // Owner (or impersonating admin) → show owner overview
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const [
    { data: todayBookings },
    { data: monthBookings },
    { data: activeBookings },
    { data: recentBookings },
    { data: pendingPOS },
  ] = await Promise.all([
    supabase.from('bookings')
      .select('total_amount, net_payout')
      .eq('owner_id', user.id)
      .eq('check_in', today)
      .neq('status', 'cancelled'),

    supabase.from('bookings')
      .select('total_amount, net_payout')
      .eq('owner_id', user.id)
      .gte('check_in', monthStart)
      .neq('status', 'cancelled'),

    supabase.from('bookings')
      .select('id')
      .eq('owner_id', user.id)
      .in('status', ['confirmed', 'checked_in']),

    supabase.from('bookings')
      .select('*, property:properties(name,type)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6)
      .returns<(Booking & { property: { name: string; type: string } })[]>(),

    supabase.from('pos_items')
      .select('total_price')
      .eq('owner_id', user.id)
      .gte('created_at', today),
  ])

  const revenueToday = (todayBookings ?? []).reduce((s, b) => s + b.total_amount, 0)
  const revenueMonth = (monthBookings ?? []).reduce((s, b) => s + b.total_amount, 0)
  const netMonth     = (monthBookings ?? []).reduce((s, b) => s + b.net_payout, 0)
  const posToday     = (pendingPOS ?? []).reduce((s, i) => s + i.total_price, 0)

  return (
    <DashboardOverviewClient
      profileName={profile?.full_name?.split(' ')[0] ?? ''}
      todayCount={todayBookings?.length ?? 0}
      revenueToday={revenueToday}
      activeCount={activeBookings?.length ?? 0}
      posToday={posToday}
      revenueMonth={revenueMonth}
      netMonth={netMonth}
      recentBookings={(recentBookings ?? []) as any}
    />
  )
}
