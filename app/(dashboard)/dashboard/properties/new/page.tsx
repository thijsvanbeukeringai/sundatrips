import { getCachedUser, getCachedProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PropertyForm from '@/components/dashboard/PropertyForm'

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ venue_id?: string }>
}) {
  const { venue_id } = await searchParams
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const profile = await getCachedProfile()

  // Admins always get all types; owners use their allowed_listing_types (fallback = all)
  const allowedTypes: string[] | undefined =
    profile?.role === 'admin'
      ? undefined  // undefined → PropertyForm shows all types
      : (profile?.allowed_listing_types as string[] | null) ?? undefined

  return (
    <div className="p-6 sm:p-8">
      <PropertyForm userId={user.id} allowedTypes={allowedTypes} defaultVenueId={venue_id} />
    </div>
  )
}
