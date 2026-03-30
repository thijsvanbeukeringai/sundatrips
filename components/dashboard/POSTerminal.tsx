'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addPOSItem, removePOSItem } from '@/app/actions/pos'
import type { Booking, POSCatalogItem, POSItem, Property } from '@/lib/types'
import { ShoppingBag, Plus, Trash2, Zap, ChevronDown, Settings } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

type BookingWithProperty = Booking & { property: Pick<Property, 'name' | 'type'> | null }

const CATEGORY_COLORS: Record<string, string> = {
  food:      'bg-amber-50 text-amber-700 border-amber-200',
  drinks:    'bg-blue-50 text-blue-700 border-blue-200',
  tours:     'bg-jungle-50 text-jungle-700 border-jungle-200',
  transport: 'bg-purple-50 text-purple-700 border-purple-200',
  wellness:  'bg-pink-50 text-pink-700 border-pink-200',
  other:     'bg-gray-50 text-gray-600 border-gray-200',
}

const CATEGORY_IDS = ['all', 'food', 'drinks', 'tours', 'transport', 'wellness', 'other'] as const

export default function POSTerminal({
  initialBookings,
  initialCatalog,
  userId,
}: {
  initialBookings: BookingWithProperty[]
  initialCatalog:  POSCatalogItem[]
  userId:          string
}) {
  const { t, lang } = useI18n()
  const pos = t.pos

  const [bookings]              = useState(initialBookings)
  const [catalog]               = useState(initialCatalog)
  const [selectedBookingId, setSelectedBookingId] = useState(initialBookings[0]?.id ?? null)
  const [posItems, setPosItems]  = useState<POSItem[]>([])
  const [catFilter, setCatFilter] = useState('all')
  const [showCart, setShowCart]   = useState(false)
  const [pending, startTransition] = useTransition()
  const supabase = createClient()

  const selectedBooking = bookings.find(b => b.id === selectedBookingId)

  useEffect(() => {
    if (!selectedBookingId) return

    supabase
      .from('pos_items')
      .select('*')
      .eq('booking_id', selectedBookingId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setPosItems((data ?? []) as POSItem[]))

    const channel = supabase
      .channel(`pos-${selectedBookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pos_items', filter: `booking_id=eq.${selectedBookingId}` },
        () => {
          // Refetch on insert to get server-computed total_price
          supabase
            .from('pos_items')
            .select('*')
            .eq('booking_id', selectedBookingId)
            .order('created_at', { ascending: true })
            .then(({ data }) => setPosItems((data ?? []) as POSItem[]))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pos_items', filter: `booking_id=eq.${selectedBookingId}` },
        (payload) => {
          // Filter locally — never refetch on delete, optimistic already handled it
          const deletedId = (payload.old as { id: string }).id
          if (deletedId) setPosItems(prev => prev.filter(i => i.id !== deletedId))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedBookingId])

  const visibleCatalog = catFilter === 'all'
    ? catalog.filter(i => i.is_active)
    : catalog.filter(i => i.is_active && i.category === catFilter)

  const tabTotal = posItems.reduce((s, i) => s + i.total_price, 0)

  function handleAdd(item: POSCatalogItem) {
    if (!selectedBookingId) return
    // Optimistic: show instantly, real-time will replace with DB record
    const tempId = `temp-${Date.now()}`
    setPosItems(prev => [...prev, {
      id:         tempId,
      booking_id: selectedBookingId,
      owner_id:   '',
      catalog_id: item.id,
      name:       item.name,
      category:   item.category,
      unit_price: item.default_price,
      quantity:   1,
      total_price: item.default_price,
      notes:      null,
      created_at: new Date().toISOString(),
    }])
    startTransition(() => { void addPOSItem(selectedBookingId, {
      name:       item.name,
      category:   item.category,
      unit_price: item.default_price,
      quantity:   1,
      catalog_id: item.id,
    }) })
  }

  function handleRemove(itemId: string) {
    if (!selectedBookingId) return
    setPosItems(items => items.filter(i => i.id !== itemId))
    startTransition(() => { void removePOSItem(itemId, selectedBookingId) })
  }

  const CATEGORIES = CATEGORY_IDS.map(id => ({
    id,
    label: pos.categories[id as keyof typeof pos.categories],
  }))

  return (
    <div className="flex h-[calc(100vh-112px)] lg:h-[calc(100vh-0px)] overflow-hidden bg-gray-50 relative">

      {/* ── Left: Catalog ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-jungle-800 text-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-sunset-500" />
              {pos.title}
            </h1>
          </div>

          {/* Booking selector */}
          <div className="relative">
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-400">{pos.noBookings}</p>
            ) : (
              <div className="relative">
                <select
                  value={selectedBookingId ?? ''}
                  onChange={e => setSelectedBookingId(e.target.value)}
                  className="appearance-none bg-jungle-800 text-white text-sm font-semibold pl-4 pr-9 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-jungle-600/30 cursor-pointer"
                >
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.guest_name} · {b.property?.name ?? ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/70 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                catFilter === cat.id
                  ? 'bg-jungle-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Catalog grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {visibleCatalog.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{pos.noCatalog}</p>
              <Link href="/dashboard/pos/catalog" className="text-jungle-700 text-sm underline mt-1 inline-block">
                {pos.addCatalog}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {visibleCatalog.map(item => (
                <button
                  key={item.id}
                  disabled={!selectedBookingId || pending}
                  onClick={() => handleAdd(item)}
                  className={`group relative bg-white rounded-2xl border p-4 text-left hover:border-jungle-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] ${CATEGORY_COLORS[item.category]}`}
                >
                  <div className="text-2xl mb-2">{item.emoji}</div>
                  <p className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-xs font-bold mt-1.5">{formatPriceRaw(item.default_price, lang)}</p>
                  <div className="absolute top-2 right-2 w-6 h-6 bg-jungle-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Catalog manage link */}
        <div className="bg-white border-t border-gray-100 px-5 py-3 flex justify-end">
          <Link
            href="/dashboard/pos/catalog"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            {pos.manageCatalog}
          </Link>
        </div>
      </div>

      {/* Mobile cart toggle button */}
      {posItems.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 lg:hidden z-30 flex items-center gap-2 bg-jungle-800 text-white font-semibold px-5 py-3 rounded-full shadow-xl shadow-jungle-900/30"
        >
          <ShoppingBag className="w-4 h-4" />
          {posItems.length} · {formatPriceRaw(tabTotal, lang)}
        </button>
      )}

      {/* Mobile cart overlay */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowCart(false)} />
      )}

      {/* ── Right: Current tab ─────────────────────────── */}
      <div className={`
        lg:w-80 lg:flex-shrink-0 lg:relative lg:translate-x-0
        fixed inset-y-0 right-0 w-full sm:w-96 z-50
        bg-white border-l border-gray-100 flex flex-col
        transform transition-transform duration-300
        ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Tab header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {selectedBooking ? selectedBooking.guest_name : pos.noBookingSelected}
            </p>
          {selectedBooking && (
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedBooking.property?.name} · {selectedBooking.guests_count} {pos.guests}
            </p>
          )}
          </div>
          <button onClick={() => setShowCart(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-50">
            {/* Room rate — always shown as first line */}
            {selectedBooking && (
              <div className="px-5 py-3 flex items-center gap-3 bg-gray-50/60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{pos.baseBooking}</p>
                  <p className="text-xs text-gray-400">{selectedBooking.property?.name}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatPriceRaw(selectedBooking.base_amount, lang)}</p>
                <div className="w-6 flex-shrink-0" />
              </div>
            )}

            {/* POS extras */}
            {posItems.length === 0 && (
              <div className="py-8 text-center text-gray-300">
                <p className="text-xs">{pos.tabEmpty}</p>
              </div>
            )}
            {posItems.map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">×{item.quantity} · {formatPriceRaw(item.unit_price, lang)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatPriceRaw(item.total_price, lang)}</p>
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
        </div>

        {/* Total */}
        <div className="border-t border-gray-100 p-5 space-y-3">
          <div className="flex justify-between font-bold">
            <span className="text-gray-800">{pos.total}</span>
            <span className="text-jungle-800 font-display text-lg">{formatPriceRaw((selectedBooking?.base_amount ?? 0) + tabTotal, lang)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{pos.yourPayout}</span>
            <span>{formatPriceRaw((selectedBooking?.base_amount ?? 0) * 0.99 + tabTotal, lang)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
