import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import {
  checkAvailability,
  createBookingRequest,
  type AvailabilityResult,
  type AvailabilitySlot,
  type AvailabilityVariant,
} from '@/lib/bookings'
import { formatPrice, priceUnitLabel } from '@/lib/format'
import { nightsBetween, nextDays } from '@/lib/dates'
import { DatePicker } from '@/components/DatePicker'
import { colors, theme } from '@/theme/colors'

export default function BookingRequest() {
  const params = useLocalSearchParams<{
    id: string
    name?: string
    type?: string
    variantId?: string
    variantName?: string
    price?: string
    unit?: string
  }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session, profile } = useAuth()

  const isStay = params.type === 'stay'
  const isActivity = params.type === 'activity' || params.type === 'trip'

  const [name, setName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [guests, setGuests] = useState(1)
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  // Availability
  const [avail, setAvail] = useState<AvailabilityResult | null>(null)
  const [availLoading, setAvailLoading] = useState(false)
  const [variant, setVariant] = useState<AvailabilityVariant | null>(null)
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  // Fetch availability when the relevant dates are set.
  useEffect(() => {
    setVariant(null)
    setSlot(null)
    setAvail(null)

    if (isStay) {
      if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) return
    } else if (isActivity) {
      if (!checkIn) return
    } else {
      return // transfers / other: no availability calendar
    }

    let active = true
    setAvailLoading(true)
    checkAvailability({
      property_id: params.id,
      check_in: checkIn ?? undefined,
      check_out: isStay ? checkOut ?? undefined : undefined,
      date: isActivity ? checkIn ?? undefined : undefined,
    })
      .then((res) => {
        if (!active) return
        setAvail(res)
        // Pre-select if the variant chosen on the detail screen is available.
        if (res.kind === 'variants' && params.variantId) {
          const match = res.variants.find((v) => v.id === params.variantId)
          if (match) setVariant(match)
        }
      })
      .finally(() => {
        if (active) setAvailLoading(false)
      })
    return () => {
      active = false
    }
  }, [checkIn, checkOut, isStay, isActivity, params.id, params.variantId])

  // Effective price / unit (a chosen room-type overrides the listing price).
  const price = variant ? variant.price_per_unit : Number(params.price ?? 0)
  const unit = variant ? variant.price_unit : params.unit ?? 'night'
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0

  const baseAmount = useMemo(() => {
    if (isStay) return price * Math.max(nights, 0)
    if (unit === 'person') return price * guests
    return price
  }, [isStay, unit, price, guests, nights])

  function validate(): string | null {
    if (!name.trim()) return 'Please enter your name.'
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email.'
    if (!checkIn) return 'Please pick a date.'
    if (isStay) {
      if (!checkOut) return 'Please pick a check-out date.'
      if (nightsBetween(checkIn, checkOut) < 1) return 'Check-out must be after check-in.'
      if (avail?.kind === 'variants' && avail.variants.length > 0 && !variant) {
        return 'Please select an available room type.'
      }
    }
    if (isActivity && avail?.kind === 'slots' && avail.slots.length > 0 && !slot) {
      return 'Please select a time slot.'
    }
    return null
  }

  async function submit() {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setBusy(true)
    try {
      const res = await createBookingRequest({
        property_id: params.id,
        guest_name: name.trim(),
        guest_email: email.trim(),
        guest_phone: phone.trim() || null,
        guests_count: guests,
        check_in: checkIn!,
        check_out: isStay ? checkOut : null,
        variant_id: isStay ? variant?.id ?? null : params.variantId || null,
        time_slot_id: isActivity ? slot?.id ?? null : null,
        slot_label: isActivity ? slot?.start_time ?? null : null,
        base_amount: baseAmount,
        notes: notes.trim(),
      })
      if (res.success) setDone(res.booking_number ?? '')
      else setError(res.error ?? 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done !== null) {
    return (
      <View style={[styles.successWrap, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={44} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Request sent!</Text>
        <Text style={styles.successBody}>
          {done ? `Your booking request #${done} has been received. ` : 'Your booking request has been received. '}
          The partner will confirm shortly. We&apos;ve emailed you the details.
        </Text>
        <Text style={styles.successNote}>No payment is needed now — you&apos;ll arrange payment with the partner.</Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/(customer)/bookings')}>
          <Text style={styles.ctaText}>View my trips</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(customer)')}>
          <Text style={styles.linkText}>Back to explore</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 130 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Request booking</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryName}>{params.name}</Text>
          {variant?.name || params.variantName ? (
            <Text style={styles.muted}>{variant?.name ?? params.variantName}</Text>
          ) : null}
          <Text style={styles.summaryPrice}>
            {formatPrice(price)} <Text style={styles.muted}>/ {priceUnitLabel(unit)}</Text>
          </Text>
        </View>

        {/* Dates */}
        <Label text={isStay ? 'Check-in' : 'Date'} />
        <DatePicker
          value={checkIn}
          onChange={(d) => {
            setCheckIn(d)
            if (checkOut && checkOut <= d) setCheckOut(null)
          }}
        />

        {isStay && (
          <>
            <Label text="Check-out" />
            <DatePicker
              value={checkOut}
              onChange={setCheckOut}
              minDate={checkIn ? nextDays(2, new Date(checkIn))[1] : undefined}
            />
          </>
        )}

        {/* Availability results */}
        {availLoading && (
          <View style={styles.availLoading}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text style={styles.muted}>Checking availability…</Text>
          </View>
        )}

        {!availLoading && avail?.kind === 'variants' && (
          <>
            <Label text="Room type" />
            {avail.variants.length === 0 ? (
              <Text style={styles.noneText}>No rooms available for these dates.</Text>
            ) : (
              avail.variants.map((v) => {
                const active = variant?.id === v.id
                return (
                  <Pressable
                    key={v.id}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => setVariant(v)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionName}>{v.name}</Text>
                      <Text style={styles.muted}>
                        {formatPrice(v.price_per_unit)} / {priceUnitLabel(v.price_unit)} ·{' '}
                        {v.rooms_available} available
                      </Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                  </Pressable>
                )
              })
            )}
          </>
        )}

        {!availLoading && avail?.kind === 'slots' && (
          <>
            <Label text="Time slot" />
            {avail.slots.length === 0 ? (
              <Text style={styles.noneText}>No time slots available on this date.</Text>
            ) : (
              <View style={styles.slotGrid}>
                {avail.slots.map((s) => {
                  const active = slot?.id === s.id
                  return (
                    <Pressable
                      key={s.id}
                      disabled={s.full}
                      style={[styles.slot, active && styles.slotActive, s.full && styles.slotFull]}
                      onPress={() => {
                        setSlot(s)
                        if (guests > s.spots_left) setGuests(Math.max(1, s.spots_left))
                      }}
                    >
                      <Text style={[styles.slotTime, active && styles.slotTimeActive, s.full && styles.slotFullText]}>
                        {s.start_time}
                      </Text>
                      <Text style={[styles.slotSpots, active && styles.slotTimeActive, s.full && styles.slotFullText]}>
                        {s.full ? 'Full' : `${s.spots_left} left`}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </>
        )}

        <Label text="Your name" />
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={theme.textMuted} />

        <Label text="Email" />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Label text="Phone (optional)" />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+62 ..."
          placeholderTextColor={theme.textMuted}
          keyboardType="phone-pad"
        />

        <Label text="Guests" />
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => setGuests((g) => Math.max(1, g - 1))}>
            <Ionicons name="remove" size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.stepValue}>{guests}</Text>
          <Pressable style={styles.stepBtn} onPress={() => setGuests((g) => g + 1)}>
            <Ionicons name="add" size={20} color={theme.text} />
          </Pressable>
        </View>

        <Label text="Notes (optional)" />
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything the partner should know?"
          placeholderTextColor={theme.textMuted}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {baseAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.muted}>
              {isStay && nights > 0 ? `${formatPrice(price)} × ${nights} nights` : 'Estimated total'}
            </Text>
            <Text style={styles.total}>{formatPrice(baseAmount)}</Text>
          </View>
        )}
        <Pressable style={[styles.cta, busy && styles.ctaDisabled]} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaText}>Send request</Text>}
        </Pressable>
        <Text style={styles.footnote}>No payment taken — this sends a request to the partner.</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.background },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.primaryDark },
  summaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryName: { fontSize: 17, fontWeight: '700', color: theme.text },
  summaryPrice: { fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 6 },
  muted: { color: theme.textMuted, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    marginBottom: 4,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  availLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  noneText: { color: colors.sunset[600], fontSize: 14, paddingVertical: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  optionActive: { borderColor: theme.primary, backgroundColor: colors.jungle[50] },
  optionName: { fontSize: 15, fontWeight: '700', color: theme.text },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 92,
    alignItems: 'center',
  },
  slotActive: { borderColor: theme.primary, backgroundColor: colors.jungle[50] },
  slotFull: { backgroundColor: colors.gray[100], borderColor: colors.gray[100] },
  slotTime: { fontSize: 15, fontWeight: '700', color: theme.text },
  slotTimeActive: { color: theme.primary },
  slotSpots: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  slotFullText: { color: colors.gray[400] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 4 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 18, fontWeight: '700', color: theme.text, minWidth: 28, textAlign: 'center' },
  error: { color: colors.sunset[600], fontSize: 14, marginTop: 12 },
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  total: { fontSize: 18, fontWeight: '800', color: theme.primary },
  cta: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  footnote: { textAlign: 'center', color: theme.textMuted, fontSize: 12, marginTop: 8 },
  successWrap: { flex: 1, backgroundColor: theme.background, alignItems: 'center', paddingHorizontal: 28, gap: 14, justifyContent: 'center' },
  successIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800', color: theme.primaryDark },
  successBody: { fontSize: 15, lineHeight: 22, color: theme.text, textAlign: 'center' },
  successNote: { fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  linkText: { color: theme.textMuted, fontSize: 14, marginTop: 4 },
})
