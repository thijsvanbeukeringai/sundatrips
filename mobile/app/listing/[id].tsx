import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/lib/supabase'
import type { ListingVariant, Property } from '@/lib/types'
import { formatPrice, priceUnitLabel } from '@/lib/format'
import { colors, theme } from '@/theme/colors'

const { width } = Dimensions.get('window')

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [property, setProperty] = useState<Property | null>(null)
  const [variants, setVariants] = useState<ListingVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const [propRes, varRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', id).eq('is_active', true).maybeSingle(),
        supabase
          .from('listing_variants')
          .select('*')
          .eq('property_id', id)
          .eq('is_active', true)
          .order('sort_order'),
      ])
      if (!active) return
      if (propRes.error || !propRes.data) setError('Listing not available.')
      else setProperty(propRes.data as Property)
      setVariants((varRes.data as ListingVariant[]) ?? [])
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  function bookVariant(variant?: ListingVariant) {
    if (!property) return
    router.push({
      pathname: '/book/[id]',
      params: {
        id: property.id,
        name: property.name,
        type: property.type,
        variantId: variant?.id ?? '',
        variantName: variant?.name ?? '',
        price: String(variant?.price_per_unit ?? property.price_per_unit),
        unit: variant?.price_unit ?? property.price_unit,
      },
    })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={theme.primary} />
      </View>
    )
  }

  if (error || !property) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.muted}>{error ?? 'Not found'}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  const images = property.images ?? []
  const isStay = property.type === 'stay'

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Image gallery */}
        <View>
          {images.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={images}
              keyExtractor={(uri, i) => `${uri}-${i}`}
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.hero} />}
            />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <Text style={styles.placeholderText}>Sunda Trips</Text>
            </View>
          )}
          <Pressable
            style={[styles.floatingBack, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.type}>{property.type.toUpperCase()}</Text>
            <Text style={styles.island}>{property.island}</Text>
          </View>
          <Text style={styles.name}>{property.name}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={15} color={theme.textMuted} />
            <Text style={styles.location}>{property.location}</Text>
          </View>

          <Text style={styles.price}>
            {formatPrice(property.price_per_unit)}{' '}
            <Text style={styles.unit}>/ {priceUnitLabel(property.price_unit)}</Text>
          </Text>

          {property.description ? (
            <>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{property.description}</Text>
            </>
          ) : null}

          {property.amenities?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenities}>
                {property.amenities.map((a) => (
                  <View key={a} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                {isStay ? 'Room types' : 'Options'}
              </Text>
              {variants.map((v) => (
                <View key={v.id} style={styles.variant}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.variantName}>{v.name}</Text>
                    {v.description ? (
                      <Text style={styles.muted} numberOfLines={2}>
                        {v.description}
                      </Text>
                    ) : null}
                    {v.max_capacity ? (
                      <Text style={styles.variantCap}>Up to {v.max_capacity} guests</Text>
                    ) : null}
                    <Text style={styles.variantPrice}>
                      {formatPrice(v.price_per_unit)}{' '}
                      <Text style={styles.unit}>/ {priceUnitLabel(v.price_unit)}</Text>
                    </Text>
                  </View>
                  <Pressable style={styles.selectBtn} onPress={() => bookVariant(v)}>
                    <Text style={styles.selectBtnText}>Select</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.cta} onPress={() => bookVariant()}>
          <Text style={styles.ctaText}>Request to book</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  muted: { color: theme.textMuted, fontSize: 14 },
  hero: { width, height: 280, backgroundColor: colors.gray[100] },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.gray[400], fontWeight: '600' },
  floatingBack: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  type: { fontSize: 12, fontWeight: '700', color: theme.accent, letterSpacing: 0.5 },
  island: { fontSize: 13, color: theme.textMuted },
  name: { fontSize: 24, fontWeight: '800', color: theme.primaryDark, marginTop: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { fontSize: 14, color: theme.textMuted },
  price: { fontSize: 20, fontWeight: '700', color: theme.primary, marginTop: 14 },
  unit: { fontSize: 14, fontWeight: '400', color: theme.textMuted },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text, marginTop: 24, marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, color: theme.text },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  amenityText: { fontSize: 13, color: theme.text },
  variant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  variantName: { fontSize: 16, fontWeight: '700', color: theme.text },
  variantCap: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  variantPrice: { fontSize: 15, fontWeight: '700', color: theme.primary, marginTop: 6 },
  selectBtn: {
    backgroundColor: colors.jungle[50],
    borderWidth: 1,
    borderColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectBtnText: { color: theme.primary, fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cta: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  backBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: { color: colors.white, fontWeight: '600' },
})
