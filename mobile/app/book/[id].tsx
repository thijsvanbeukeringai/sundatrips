import { useMemo, useState } from 'react'
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
import { createBookingRequest } from '@/lib/bookings'
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

  const price = Number(params.price ?? 0)
  const unit = params.unit ?? 'night'
  const isStay = params.type === 'stay'

  const [name, setName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [guests, setGuests] = useState(1)
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null) // booking number on success

  const baseAmount = useMemo(() => {
    if (unit === 'night') {
      const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
      return price * Math.max(nights, 0)
    }
    if (unit === 'person') return price * guests
    return price
  }, [unit, price, guests, checkIn, checkOut])

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0

  function validate(): string | null {
    if (!name.trim()) return 'Please enter your name.'
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email.'
    if (!checkIn) return 'Please pick a date.'
    if (isStay) {
      if (!checkOut) return 'Please pick a check-out date.'
      if (nightsBetween(checkIn, checkOut) < 1) return 'Check-out must be after check-in.'
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
        variant_id: params.variantId || null,
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
        <Pressable
          style={styles.cta}
          onPress={() => router.replace('/(customer)/bookings')}
        >
          <Text style={styles.ctaText}>View my trips</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(customer)')}>
          <Text style={styles.linkText}>Back to explore</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 }]}
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
          {params.variantName ? <Text style={styles.muted}>{params.variantName}</Text> : null}
          <Text style={styles.summaryPrice}>
            {formatPrice(price)} <Text style={styles.muted}>/ {priceUnitLabel(unit)}</Text>
          </Text>
        </View>

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

        <Label text={isStay ? 'Check-in' : 'Date'} />
        <DatePicker value={checkIn} onChange={(d) => {
          setCheckIn(d)
          if (checkOut && checkOut <= d) setCheckOut(null)
        }} />

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

      {/* Sticky submit */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {baseAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.muted}>
              {unit === 'night' && nights > 0 ? `${formatPrice(price)} × ${nights} nights` : 'Estimated total'}
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
  label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    marginBottom: 16,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
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
  // Success screen
  successWrap: { flex: 1, backgroundColor: theme.background, alignItems: 'center', paddingHorizontal: 28, gap: 14, justifyContent: 'center' },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: theme.primaryDark },
  successBody: { fontSize: 15, lineHeight: 22, color: theme.text, textAlign: 'center' },
  successNote: { fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  linkText: { color: theme.textMuted, fontSize: 14, marginTop: 4 },
})
