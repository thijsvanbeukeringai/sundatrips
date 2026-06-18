import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Decides which route group the user is allowed to be in.
// - Customers can browse anonymously → (customer) is always public.
// - The partner area requires a session with a partner role.
function useProtectedRoutes() {
  const { loading, session, audience } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const group = segments[0] // '(auth)' | '(customer)' | '(partner)' | undefined

    if (session && audience === 'partner') {
      // Partners live in the partner area; bounce them out of auth/customer.
      if (group !== '(partner)') router.replace('/(partner)')
    } else if (group === '(partner)') {
      // Anyone without partner access cannot be in the partner area.
      router.replace('/(customer)')
    } else if (group === '(auth)' && session) {
      // Logged-in customer sitting on the login screen → go home.
      router.replace('/(customer)')
    }
  }, [loading, session, audience, segments, router])
}

function RootNavigator() {
  useProtectedRoutes()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(partner)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
