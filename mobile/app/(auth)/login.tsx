import { useState } from 'react'
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
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import { colors, theme } from '@/theme/colors'

type Mode = 'partner' | 'guest'

export default function Login() {
  const { signInWithPassword, signInWithOtp } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [mode, setMode] = useState<Mode>('partner')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  async function handleSubmit() {
    setError(null)
    setBusy(true)
    try {
      if (mode === 'partner') {
        const { error } = await signInWithPassword(email.trim(), password)
        if (error) setError(error)
        // On success the auth listener + route guard redirect automatically.
      } else {
        const { error } = await signInWithOtp(email.trim())
        if (error) setError(error)
        else setMagicSent(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sunda Trips</Text>
        <Text style={styles.subtitle}>
          {mode === 'partner' ? 'Partner & owner login' : 'View your bookings'}
        </Text>

        <View style={styles.switcher}>
          <Pressable
            style={[styles.switchBtn, mode === 'partner' && styles.switchActive]}
            onPress={() => {
              setMode('partner')
              setError(null)
              setMagicSent(false)
            }}
          >
            <Text style={[styles.switchText, mode === 'partner' && styles.switchTextActive]}>
              Partner
            </Text>
          </Pressable>
          <Pressable
            style={[styles.switchBtn, mode === 'guest' && styles.switchActive]}
            onPress={() => {
              setMode('guest')
              setError(null)
            }}
          >
            <Text style={[styles.switchText, mode === 'guest' && styles.switchTextActive]}>
              Guest
            </Text>
          </Pressable>
        </View>

        {magicSent ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Check your inbox — we sent a magic link to {email.trim()}.
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            {mode === 'partner' && (
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              disabled={busy}
              onPress={handleSubmit}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'partner' ? 'Log in' : 'Send magic link'}
                </Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable style={styles.backLink} onPress={() => router.replace('/(customer)')}>
          <Text style={styles.backLinkText}>← Continue browsing as guest</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.primaryDark,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textMuted,
    marginTop: 4,
    marginBottom: 28,
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  switchActive: {
    backgroundColor: theme.background,
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  switchText: { color: theme.textMuted, fontWeight: '600' },
  switchTextActive: { color: theme.primary },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    marginBottom: 12,
  },
  error: {
    color: colors.sunset[600],
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  notice: {
    backgroundColor: colors.jungle[50],
    borderRadius: 12,
    padding: 16,
  },
  noticeText: { color: theme.primary, fontSize: 15, lineHeight: 22 },
  backLink: { marginTop: 28, alignItems: 'center' },
  backLinkText: { color: theme.textMuted, fontSize: 14 },
})
