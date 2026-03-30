import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PropertyForm from '@/components/dashboard/PropertyForm'

export default async function NewPropertyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('allowed_listing_types, role')
    .eq('id', user.id)
    .single()

  // Admins always get all types; owners use their allowed_listing_types (fallback = all)
  const allowedTypes: string[] | undefined =
    profile?.role === 'admin'
      ? undefined  // undefined → PropertyForm shows all types
      : (profile?.allowed_listing_types as string[] | null) ?? undefined

  return (
    <div className="p-6 sm:p-8">
      <PropertyForm userId={user.id} allowedTypes={allowedTypes} />
    </div>
  )
}
