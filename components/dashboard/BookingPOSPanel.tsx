'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addPOSItem, removePOSItem, markExtrasPaid } from '@/app/actions/pos'
import type { POSCatalogItem, POSItem } from '@/lib/types'
import { ShoppingBag, Trash2, CheckCircle2, Plus, History } from 'lucide-react'
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

interface BillPayment {
  id:           string
  total_amount: number
  paid_at:      string
  items:        Array<{ name: string; quantity: number; unit_price: number; total_price: number }>
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BookingPOSPanel({
  bookingId,
  initialPosItems,
  catalog,
}: {
  bookingId:       string
  initialPosItems: POSItem[]
  catalog:         POSCatalogItem[]
  extrasPaid:      boolean  // kept for API compat, not used internally
}) {
  const { lang } = useI18n()
  const [posItems, setPosItems]       = useState<POSItem[]>(initialPosItems)
  const [payments, setPayments]       = useState<BillPayment[]>([])
  const [catFilter, setCatFilter]     = useState('all')
  const [showHistory, setShowHistory] = useState(false)
  const [pending, startTransition]    = useTransition()
  const supabase = createClient()

  // Fetch payment history
  useEffect(() => {
    supabase
      .from('bill_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('paid_at', { ascending: false })
      .then(({ data }) => setPayments((data ?? []) as BillPayment[]))
  }, [bookingId])

  // Real-time: pos_items
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
        { event: 'INSERT', schema: 'public', table: 'pos_items', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const newItem = payload.new as POSItem
          setPosItems(prev => {
            // Replace the matching temp item; otherwise append (added from another device)
            const tempIdx = prev.findIndex(i => i.id.startsWith('temp-') && i.catalog_id === newItem.catalog_id)
            if (tempIdx !== -1) {
              const next = [...prev]
              next[tempIdx] = newItem
              return next
            }
            return [...prev, newItem]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pos_items', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          if (deletedId) setPosItems(prev => prev.filter(i => i.id !== deletedId))
        }
      )
      // Real-time: bill_payments (refresh history when a new payment is recorded)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bill_payments', filter: `booking_id=eq.${bookingId}` },
        () => {
          supabase
            .from('bill_payments')
            .select('*')
            .eq('booking_id', bookingId)
            .order('paid_at', { ascending: false })
            .then(({ data }) => setPayments((data ?? []) as BillPayment[]))
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
    // Optimistic: show instantly, real-time INSERT will replace temp with DB record
    const tempId = `temp-${Date.now()}`
    setPosItems(prev => [...prev, {
      id:          tempId,
      booking_id:  bookingId,
      owner_id:    '',
      catalog_id:  item.id,
      name:        item.name,
      category:    item.category,
      unit_price:  item.default_price,
      quantity:    1,
      total_price: item.default_price,
      notes:       null,
      created_at:  new Date().toISOString(),
    }])
    // Fire and forget — never block the UI
    void addPOSItem(bookingId, {
      name:       item.name,
      category:   item.category,
      unit_price: item.default_price,
      quantity:   1,
      catalog_id: item.id,
    })
  }

  function handleRemove(itemId: string) {
    setPosItems(items => items.filter(i => i.id !== itemId))
    startTransition(() => { void removePOSItem(itemId, bookingId) })
  }

  function handlePay() {
    startTransition(async () => {
      const result = await markExtrasPaid(bookingId)
      if (!result?.error) {
        // Items cleared server-side; real-time will update posItems
        // Refresh payments locally for instant feedback
        const { data } = await supabase
          .from('bill_payments')
          .select('*')
          .eq('booking_id', bookingId)
          .order('paid_at', { ascending: false })
        setPayments((data ?? []) as BillPayment[])
        setShowHistory(true)
      }
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
        {payments.length > 0 && (
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            {payments.length} payment{payments.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Catalog grid */}
      {catalog.filter(i => i.is_active).length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  catFilter === cat ? 'bg-jungle-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {activeCatalog.map(item => (
              <button
                key={item.id}
                onClick={() => handleAdd(item)}
                className={`group relative rounded-xl border p-3 text-left hover:shadow-md transition-all active:scale-[0.97] ${CATEGORY_COLORS[item.category]}`}
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

      {/* Current bill */}
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
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={pending}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {posItems.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Bill total</p>
              <p className="font-display text-xl font-bold text-jungle-800">{formatPriceRaw(billTotal, lang)}</p>
            </div>
            <button
              onClick={handlePay}
              disabled={pending}
              className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Paid
            </button>
          </div>
        )}
      </div>

      {/* Payment history */}
      {showHistory && payments.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            Payment history
          </h3>
          <div className="space-y-4">
            {payments.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{formatDateTime(p.paid_at)}</span>
                  <span className="text-sm font-bold text-jungle-800">{formatPriceRaw(p.total_amount, lang)}</span>
                </div>
                <div className="space-y-1">
                  {p.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-500">
                      <span>{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                      <span>{formatPriceRaw(item.total_price, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
