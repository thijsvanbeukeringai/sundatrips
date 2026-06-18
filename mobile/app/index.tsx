import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { useAuth } from '@/contexts/AuthContext'
import { colors } from '@/theme/colors'

// Entry point: show a splash while the session resolves, then route the
// user to the correct side of the app.
export default function Index() {
  const { loading, session, audience } = useAuth()

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sunda Trips</Text>
        <Text style={styles.tagline}>Where the Jungle Meets the Sea</Text>
        <ActivityIndicator color={colors.jungle[300]} style={styles.spinner} />
      </View>
    )
  }

  if (session && audience === 'partner') {
    return <Redirect href="/(partner)" />
  }

  return <Redirect href="/(customer)" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.jungle[900],
    gap: 8,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.jungle[200],
    fontSize: 14,
  },
  spinner: {
    marginTop: 24,
  },
})
