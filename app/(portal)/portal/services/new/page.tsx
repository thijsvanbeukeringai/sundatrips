import { createClient, getCachedProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PropertyForm from '@/components/dashboard/PropertyForm'
import { createPartnerService } from '@/app/actions/partner'

export default async function NewPartnerServicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCachedProfile()
  if (!profile || profile.role !== 'partner') redirect('/login')

  // Partners can create trips, activities, and transfers (not stays)
  const allowedTypes = ['trip', 'activity', 'transfer']

  return (
    <PropertyForm
      userId={user.id}
      allowedTypes={allowedTypes}
      backHref="/portal/services"
      createAction={createPartnerService}
    />
  )
}
