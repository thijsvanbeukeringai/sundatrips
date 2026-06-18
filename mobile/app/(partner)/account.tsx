import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import { colors, theme } from '@/theme/colors'

export default function PartnerAccount() {
  const insets = useSafeAreaInsets()
  const { profile, session, signOut } = useAuth()

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{profile?.full_name ?? session?.user?.email}</Text>
        <Text style={styles.muted}>{session?.user?.email}</Text>
        {profile?.role && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile.role}</Text>
          </View>
        )}
      </View>

      {profile?.company_name && (
        <View style={styles.card}>
          <Text style={styles.label}>Company</Text>
          <Text style={styles.value}>{profile.company_name}</Text>
          {profile.company_location && <Text style={styles.muted}>{profile.company_location}</Text>}
        </View>
      )}

      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Full management (listings, availability, POS, financials) lives in the web dashboard.
          More partner tools are coming to the app.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface, paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: theme.primaryDark },
  card: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  name: { fontSize: 18, fontWeight: '700', color: theme.text },
  label: { fontSize: 12, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '600', color: theme.text },
  muted: { color: theme.textMuted, fontSize: 14 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.jungle[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: theme.primary, fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  footer: { marginTop: 'auto', paddingBottom: 24 },
  footerText: { color: theme.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
})
