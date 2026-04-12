import { createClient, getCachedProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PropertyForm from '@/components/dashboard/PropertyForm'
import { getPartnerServiceById, updatePartnerService } from '@/app/actions/partner'

export default async function EditPartnerServicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCachedProfile()
  if (!profile || profile.role !== 'partner') redirect('/login')

  const property = await getPartnerServiceById(params.id)
  if (!property) redirect('/portal/services')

  const allowedTypes = ['trip', 'activity', 'transfer']

  return (
    <PropertyForm
      userId={user.id}
      property={property}
      allowedTypes={allowedTypes}
      backHref="/portal/services"
      updateAction={updatePartnerService}
    />
  )
}
