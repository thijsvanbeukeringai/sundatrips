import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/types'
import { formatPrice } from '@/lib/format'
import { colors, theme } from '@/theme/colors'

interface Stats {
  checkInsToday: number
  activeBookings: number
  revenueMonth: number
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function monthStartISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export default function PartnerDashboard() {
  const insets = useSafeAreaInsets()
  const { profile } = useAuth()

  const [stats, setStats] = useState<Stats>({ checkInsToday: 0, activeBookings: 0, revenueMonth: 0 })
  const [recent, setRecent] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    // RLS scopes these queries to the signed-in partner/owner automatically.
    const today = todayISO()
    const monthStart = monthStartISO()

    const [recentRes, monthRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, property:properties(*)')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('bookings')
        .select('net_payout, check_in, status')
        .gte('check_in', monthStart),
    ])

    const recentRows = (recentRes.data as Booking[]) ?? []
    setRecent(recentRows)

    const monthRows = (monthRes.data as Pick<Booking, 'net_payout' | 'check_in' | 'status'>[]) ?? []
    setStats({
      checkInsToday: monthRows.filter((b) => b.check_in === today).length,
      activeBookings: monthRows.filter(
        (b) => b.status === 'confirmed' || b.status === 'checked_in'
      ).length,
      revenueMonth: monthRows
        .filter((b) => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.net_payout ?? 0), 0),
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
      </Text>
      <Text style={styles.subtitle}>Here is how your business is doing.</Text>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Check-ins today" value={String(stats.checkInsToday)} />
            <Kpi label="Active bookings" value={String(stats.activeBookings)} />
          </View>
          <View style={styles.kpiRow}>
            <Kpi label="Net payout (month)" value={formatPrice(stats.revenueMonth)} wide />
          </View>

          <Text style={styles.sectionTitle}>Recent bookings</Text>
          {recent.length === 0 ? (
            <Text style={styles.muted}>No bookings yet.</Text>
          ) : (
            recent.map((b) => (
              <View key={b.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {b.guest_name}
                  </Text>
                  <Text style={styles.muted} numberOfLines={1}>
                    {b.property?.name ?? '—'} · {b.check_in}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{formatPrice(b.total_amount)}</Text>
                  <Text style={styles.rowStatus}>{b.status.replace('_', ' ')}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  )
}

function Kpi({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.kpi, wide && styles.kpiWide]}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 26, fontWeight: '700', color: theme.primaryDark, marginTop: 8 },
  subtitle: { fontSize: 14, color: theme.textMuted, marginTop: 2, marginBottom: 20 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpi: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  kpiWide: { flex: 1 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: theme.primary },
  kpiLabel: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: 24,
    marginBottom: 12,
  },
  muted: { color: theme.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowName: { fontSize: 15, fontWeight: '600', color: theme.text },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 15, fontWeight: '700', color: theme.primary },
  rowStatus: { fontSize: 12, color: theme.textMuted, textTransform: 'capitalize', marginTop: 2 },
})
