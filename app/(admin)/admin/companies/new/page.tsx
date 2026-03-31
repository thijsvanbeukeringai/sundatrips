import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import VenueForm from '@/components/admin/VenueForm'

export default async function AdminNewCompanyPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('full_name')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-jungle-900 px-6 py-4 flex items-center gap-4">
        <Link href="/admin/companies" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-bold text-white text-lg">Add Company</h1>
      </header>

      <div className="max-w-2xl mx-auto p-6 sm:p-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-jungle-50 rounded-2xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-jungle-800" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-jungle-800">New Company</h2>
              <p className="text-gray-400 text-xs mt-0.5">Group properties under a business / venue</p>
            </div>
          </div>
          <VenueForm profiles={profiles ?? []} />
        </div>
      </div>
    </div>
  )
}
