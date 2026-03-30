'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addPOSItem, removePOSItem, markExtrasPaid } from '@/app/actions/pos'
import type { POSCatalogItem, POSItem } from '@/lib/types'
import { ShoppingBag, Trash2, CheckCircle2, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

const CATEGORY_COLORS: Record<string, string> = {
  food:      'bg-amber-50 text-amber-700 border-amber-200',
  drinks:    'bg-blue-50 text-blue-700 border-blue-200',
  tours:     'bg-jungle-50 text-jungle-700 border-jungle-200',
  transport: 'bg-purple-50 text-purple-700 border-purple-200',
  wellness:  'bg-pink-50 text-pink-700 border-pink-200',
  other:     'bg-gray-50 text-gray-600 border-gray-200',
}

export default function BookingPOSPanel({
  bookingId,
  initialPosItems,
  catalog,
  extrasPaid: initialExtrasPaid,
}: {
  bookingId:       string
  initialPosItems: POSItem[]
  catalog:         POSCatalogItem[]
  extrasPaid:      boolean
}) {
  const { lang } = useI18n()
  const [posItems, setPosItems]     = useState<POSItem[]>(initialPosItems)
  const [extrasPaid, setExtrasPaid] = useState(initialExtrasPaid)
  const [catFilter, setCatFilter]   = useState('all')
  const [pending, startTransition]  = useTransition()
  const supabase = createClient()

  // Real-time subscription — updates bill immediately when items are added/removed
  useEffect(() => {
    supabase
      .from('pos_items')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setPosItems((data ?? []) as POSItem[]))

    const channel = supabase
      .channel(`pos-booking-${bookingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_items', filter: `booking_id=eq.${bookingId}` },
        () => {
          supabase
            .from('pos_items')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true })
            .then(({ data }) => setPosItems((data ?? []) as POSItem[]))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  const activeCatalog = catFilter === 'all'
    ? catalog.filter(i => i.is_active)
    : catalog.filter(i => i.is_active && i.category === catFilter)

  const categories = ['all', ...Array.from(new Set(catalog.filter(i => i.is_active).map(i => i.category)))]
  const billTotal  = posItems.reduce((s, i) => s + i.total_price, 0)

  function handleAdd(item: POSCatalogItem) {
    startTransition(() => {
      void addPOSItem(bookingId, {
        name:       item.name,
        category:   item.category,
        unit_price: item.default_price,
        quantity:   1,
        catalog_id: item.id,
      })
    })
  }

  function handleRemove(itemId: string) {
    startTransition(() => { void removePOSItem(itemId, bookingId) })
  }

  function handlePay() {
    startTransition(async () => {
      await markExtrasPaid(bookingId)
      setExtrasPaid(true)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Open bill
        </h2>
        {extrasPaid && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-jungle-700 bg-jungle-50 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Bill settled
          </span>
        )}
      </div>

      {/* Catalog grid */}
      {catalog.filter(i => i.is_active).length > 0 && (
        <div className="px-6 pt-4 pb-2">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  catFilter === cat
                    ? 'bg-jungle-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {activeCatalog.map(item => (
              <button
                key={item.id}
                onClick={() => handleAdd(item)}
                disabled={pending}
                className={`group relative rounded-xl border p-3 text-left hover:shadow-md transition-all active:scale-[0.97] disabled:opacity-50 ${CATEGORY_COLORS[item.category]}`}
              >
                <div className="text-xl mb-1">{item.emoji}</div>
                <p className="font-semibold text-xs leading-snug line-clamp-2">{item.name}</p>
                <p className="text-[11px] font-bold mt-1">{formatPriceRaw(item.default_price, lang)}</p>
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-jungle-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bill */}
      <div className="px-6 py-4">
        {posItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No items on the bill yet.</p>
        ) : (
          <div className="space-y-1 mb-4">
            {posItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{item.name}</span>
                  <span className="text-xs text-gray-400 ml-2">×{item.quantity} · {formatPriceRaw(item.unit_price, lang)}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{formatPriceRaw(item.total_price, lang)}</span>
                {!extrasPaid && (
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={pending}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Total + Pay button */}
        {posItems.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Bill total</p>
              <p className="font-display text-xl font-bold text-jungle-800">{formatPriceRaw(billTotal, lang)}</p>
            </div>
            {!extrasPaid ? (
              <button
                onClick={handlePay}
                disabled={pending || posItems.length === 0}
                className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Paid
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-jungle-700">
                <CheckCircle2 className="w-4 h-4" />
                Paid
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
