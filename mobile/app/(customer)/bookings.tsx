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
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Booking, BookingStatus } from '@/lib/types'
import { formatPrice } from '@/lib/format'
import { colors, theme } from '@/theme/colors'

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: colors.sand[200],
  confirmed: colors.jungle[200],
  checked_in: colors.jungle[300],
  completed: colors.gray[200],
  cancelled: colors.gray[200],
}

export default function MyBookings() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { session } = useAuth()
  const email = session?.user?.email

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!email) {
      setBookings([])
      return
    }
    const { data } = await supabase
      .from('bookings')
      .select('*, property:properties(*), variant:listing_variants(*)')
      .eq('guest_email', email)
      .order('check_in', { ascending: false })
    setBookings((data as Booking[]) ?? [])
  }, [email])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  if (!session) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.bigTitle}>My Trips</Text>
        <Text style={styles.muted}>Log in to see your bookings.</Text>
        <Pressable style={styles.button} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.buttonText}>Log in</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <Text style={styles.subtitle}>{email}</Text>
      </View>

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
              <Text style={styles.muted}>No bookings yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.property?.name ?? 'Booking'}
                </Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                  <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
                </View>
              </View>
              {item.variant?.name && <Text style={styles.muted}>{item.variant.name}</Text>}
              <Text style={styles.dates}>
                {item.check_in}
                {item.check_out ? ` → ${item.check_out}` : ''}
              </Text>
              <Text style={styles.total}>{formatPrice(item.total_amount)}</Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: theme.primaryDark },
  bigTitle: { fontSize: 28, fontWeight: '700', color: theme.primaryDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  muted: { color: theme.textMuted, fontSize: 14 },
  listContent: { padding: 20, gap: 14 },
  card: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700', color: theme.primaryDark, textTransform: 'capitalize' },
  dates: { fontSize: 14, color: theme.text, marginTop: 2 },
  total: { fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 6 },
  button: {
    backgroundColor: theme.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
})
