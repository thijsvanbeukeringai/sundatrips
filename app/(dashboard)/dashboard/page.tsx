import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Booking, Profile } from '@/lib/types'
import DashboardOverviewClient from '@/components/dashboard/DashboardOverviewClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

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
