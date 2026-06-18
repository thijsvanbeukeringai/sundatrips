import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/lib/supabase'
import type { Property, PropertyType } from '@/lib/types'
import { formatPrice, priceUnitLabel } from '@/lib/format'
import { colors, theme } from '@/theme/colors'

const FILTERS: { label: string; value: PropertyType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Stays', value: 'stay' },
  { label: 'Trips', value: 'trip' },
  { label: 'Activities', value: 'activity' },
  { label: 'Transfers', value: 'transfer' },
]

export default function Explore() {
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState<PropertyType | 'all'>('all')
  const [listings, setListings] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    let query = supabase
      .from('properties')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('type', filter)

    const { data, error } = await query
    if (error) setError(error.message)
    else setListings((data as Property[]) ?? [])
  }, [filter])

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
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Stays, trips & activities in Lombok, Bali & the Gilis</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f.value}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => {
          const active = filter === item.value
          return (
            <Pressable
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(item.value)}
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
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={onRefresh} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No listings found.</Text>
            </View>
          }
          renderItem={({ item }) => <ListingCard listing={item} />}
        />
      )}
    </View>
  )
}

function ListingCard({ listing }: { listing: Property }) {
  const router = useRouter()
  const cover = listing.images?.[0]
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.placeholderText}>Sunda Trips</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardType}>{listing.type.toUpperCase()}</Text>
          <Text style={styles.cardIsland}>{listing.island}</Text>
        </View>
        <Text style={styles.cardName} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          {listing.location}
        </Text>
        <Text style={styles.cardPrice}>
          {formatPrice(listing.price_per_unit)}{' '}
          <Text style={styles.cardUnit}>/ {priceUnitLabel(listing.price_unit)}</Text>
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: theme.primaryDark },
  subtitle: { fontSize: 14, color: theme.textMuted, marginTop: 2 },
  filterRow: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.gray[100],
  },
  chipActive: { backgroundColor: theme.primary },
  chipText: { color: theme.text, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  error: { color: colors.sunset[600], textAlign: 'center' },
  empty: { color: theme.textMuted },
  retry: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: colors.white, fontWeight: '600' },
  listContent: { padding: 20, gap: 16 },
  card: {
    backgroundColor: theme.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardImage: { width: '100%', height: 180, backgroundColor: colors.gray[100] },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.gray[400], fontWeight: '600' },
  cardBody: { padding: 14, gap: 2 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  cardType: { fontSize: 11, fontWeight: '700', color: theme.accent, letterSpacing: 0.5 },
  cardIsland: { fontSize: 12, color: theme.textMuted },
  cardName: { fontSize: 17, fontWeight: '700', color: theme.text },
  cardLocation: { fontSize: 13, color: theme.textMuted },
  cardPrice: { fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 6 },
  cardUnit: { fontSize: 13, fontWeight: '400', color: theme.textMuted },
})
