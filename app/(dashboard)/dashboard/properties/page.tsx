import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Property } from '@/lib/types'
import PropertiesPageClient from '@/components/dashboard/PropertiesPageClient'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return <PropertiesPageClient properties={(properties ?? []) as Property[]} />
}
