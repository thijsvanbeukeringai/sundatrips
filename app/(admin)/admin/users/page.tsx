import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import UserRow from '@/components/admin/UserRow'

export default async function AdminUsersPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: profiles }, { data: properties }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, phone, role, created_at').order('created_at', { ascending: false }),
    supabase.from('properties').select('id, owner_id'),
  ])

  const users = (profiles ?? []).sort((a, b) => {
    if (a.id === user.id) return -1
    if (b.id === user.id) return 1
    return 0
  })

  const listingCounts = Object.fromEntries(
    users.map(u => [u.id, (properties ?? []).filter(p => p.owner_id === u.id).length])
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-jungle-900 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-bold text-white text-lg flex-1">Users</h1>
        <Link
          href="/admin/invite"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite
        </Link>
      </header>

      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <p className="text-sm text-gray-400 mb-6">
          {users.length} account{users.length !== 1 ? 's' : ''} · Click Edit to change name or role, or send a password reset email.
        </p>

        <div className="space-y-3">
          {users.map(u => (
            <UserRow
              key={u.id}
              user={{ id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, role: u.role as 'owner' | 'admin' }}
              listingCount={listingCounts[u.id] ?? 0}
              isYou={u.id === user.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
