import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PropertyForm from '@/components/dashboard/PropertyForm'
import type { Property } from '@/lib/types'

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data }, { data: profile }] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('allowed_listing_types, role')
      .eq('id', user.id)
      .single(),
  ])

  if (!data) notFound()

  const allowedTypes: string[] | undefined =
    profile?.role === 'admin'
      ? undefined
      : (profile?.allowed_listing_types as string[] | null) ?? undefined

  return (
    <div className="p-6 sm:p-8">
      <PropertyForm userId={user.id} property={data as Property} allowedTypes={allowedTypes} />
    </div>
  )
}
