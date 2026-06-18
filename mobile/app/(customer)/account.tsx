import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import { colors, theme } from '@/theme/colors'

export default function Account() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { session, signOut } = useAuth()

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Account</Text>

      {session ? (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Signed in as</Text>
            <Text style={styles.value}>{session.user?.email}</Text>
          </View>
          <Pressable style={[styles.button, styles.outline]} onPress={signOut}>
            <Text style={[styles.buttonText, styles.outlineText]}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.muted}>
            Log in to view your bookings, or sign in as a partner to manage your listings.
          </Text>
          <Pressable style={styles.button} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.buttonText}>Log in / Partner login</Text>
          </Pressable>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sunda Trips · Non-profit booking platform</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: theme.primaryDark },
  muted: { color: theme.textMuted, fontSize: 15, lineHeight: 22 },
  card: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  label: { fontSize: 12, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '600', color: theme.text },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
  outlineText: { color: theme.text },
  footer: { marginTop: 'auto', paddingBottom: 24, alignItems: 'center' },
  footerText: { color: colors.gray[400], fontSize: 12 },
})
