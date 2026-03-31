import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import type { POSCatalogItem } from '@/lib/types'
import AddCatalogItemForm from '@/components/dashboard/AddCatalogItemForm'
import CatalogItemRow from '@/components/dashboard/CatalogItemRow'

const CATEGORY_LABELS: Record<string, string> = {
  food: '🍽️ Food', drinks: '🥤 Drinks', tours: '🗺️ Tours',
  transport: '🚗 Transport', wellness: '💆 Wellness', other: '🛍️ Other',
}

export default async function CatalogPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data } = await supabase
    .from('pos_catalog')
    .select('*')
    .eq('owner_id', user.id)
    .order('category')
    .order('name')

  const catalog = (data ?? []) as POSCatalogItem[]

  // Group by category
  const grouped = catalog.reduce<Record<string, POSCatalogItem[]>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item]
    return acc
  }, {})

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/pos" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-jungle-800">POS Catalog</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage the items available in your POS terminal</p>
        </div>
      </div>

      {/* Add item form */}
      <AddCatalogItemForm />

      {/* Catalog list */}
      {catalog.length === 0 ? (
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
          <p className="text-sm">No items yet — add your first one above.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {items.map(item => (
                  <CatalogItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
