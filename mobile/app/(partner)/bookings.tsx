import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/lib/supabase'
import type { Booking, BookingStatus } from '@/lib/types'
import { formatPrice } from '@/lib/format'
import { colors, theme } from '@/theme/colors'

const TABS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Checked in', value: 'checked_in' },
  { label: 'Completed', value: 'completed' },
]

export default function PartnerBookings() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<BookingStatus | 'all'>('all')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    let query = supabase
      .from('bookings')
      .select('*, property:properties(*)')
      .order('check_in', { ascending: false })

    if (tab !== 'all') query = query.eq('status', tab)

    const { data } = await query
    setBookings((data as Booking[]) ?? [])
  }, [tab])

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TABS}
        keyExtractor={(t) => t.value}
        style={styles.tabRow}
        contentContainerStyle={styles.tabContent}
        renderItem={({ item }) => {
          const active = tab === item.value
          return (
            <Pressable
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTab(item.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          )
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>No bookings in this category.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.guest_name}
                </Text>
                <Text style={styles.amount}>{formatPrice(item.total_amount)}</Text>
              </View>
              <Text style={styles.muted} numberOfLines={1}>
                {item.property?.name ?? '—'}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.dates}>
                  {item.check_in}
                  {item.check_out ? ` → ${item.check_out}` : ''}
                </Text>
                <Text style={styles.status}>{item.status.replace('_', ' ')}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: '700', color: theme.primaryDark },
  tabRow: { flexGrow: 0 },
  tabContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.gray[100],
  },
  chipActive: { backgroundColor: theme.primary },
  chipText: { color: theme.text, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  muted: { color: theme.textMuted, fontSize: 14 },
  listContent: { padding: 20, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1, marginRight: 8 },
  amount: { fontSize: 15, fontWeight: '700', color: theme.primary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dates: { fontSize: 14, color: theme.text },
  status: { fontSize: 12, color: theme.textMuted, textTransform: 'capitalize' },
})
