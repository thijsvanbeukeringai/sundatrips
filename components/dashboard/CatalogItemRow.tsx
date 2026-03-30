'use client'

import { useState, useTransition } from 'react'
import { toggleCatalogItem, deleteCatalogItem, updateCatalogItem } from '@/app/actions/pos'
import type { POSCatalogItem } from '@/lib/types'
import { ToggleLeft, ToggleRight, Trash2, Pencil, X, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'
import { EUR_TO_IDR } from '@/lib/currency'

const inputClass = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500 bg-white'

const CATEGORIES = ['food', 'drinks', 'tours', 'transport', 'wellness', 'other'] as const

export default function CatalogItemRow({ item }: { item: POSCatalogItem }) {
  const [pending, startTransition] = useTransition()
  const { lang } = useI18n()

  const [deleted,       setDeleted]       = useState(false)
  const [editing,       setEditing]       = useState(false)
  // Display state (shown in the row)
  const [displayEmoji,  setDisplayEmoji]  = useState(item.emoji)
  const [displayName,   setDisplayName]   = useState(item.name)
  const [displayPrice,  setDisplayPrice]  = useState(item.default_price)
  // Form state (shown in the modal)
  const [emoji,   setEmoji]   = useState(item.emoji)
  const [name,    setName]    = useState(item.name)
  const [cat,     setCat]     = useState<typeof CATEGORIES[number]>(item.category as typeof CATEGORIES[number])
  const [price,   setPrice]   = useState(
    lang === 'id' ? String(Math.round(item.default_price * EUR_TO_IDR)) : String(item.default_price)
  )

  if (deleted) return null

  function openEdit() {
    // Reset to current values in correct currency when opening
    setEmoji(item.emoji)
    setName(item.name)
    setCat(item.category)
    setPrice(lang === 'id' ? String(Math.round(item.default_price * EUR_TO_IDR)) : String(item.default_price))
    setEditing(true)
  }

  function handleSave() {
    const rawPrice = parseFloat(price)
    const eurPrice = lang === 'id' ? rawPrice / EUR_TO_IDR : rawPrice
    // Optimistically update display
    setDisplayEmoji(emoji)
    setDisplayName(name)
    setDisplayPrice(eurPrice)
    setEditing(false)
    startTransition(() => {
      void updateCatalogItem(item.id, { name, category: cat, default_price: eurPrice, emoji })
    })
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xl flex-shrink-0">{displayEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${item.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
            {displayName}
          </p>
          <p className="text-xs text-gray-400">{formatPriceRaw(displayPrice, lang)}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            disabled={pending}
            title="Edit"
            onClick={openEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={pending}
            title={item.is_active ? 'Deactivate' : 'Activate'}
            onClick={() => startTransition(() => { void toggleCatalogItem(item.id, !item.is_active) })}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
              item.is_active ? 'text-jungle-600 hover:bg-jungle-50' : 'text-gray-300 hover:bg-gray-100'
            }`}
          >
            {item.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button
            disabled={pending}
            title="Delete"
            onClick={() => {
              setDeleted(true)
              startTransition(() => { void deleteCatalogItem(item.id) })
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit popup / modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-800">Edit item</h3>
              <button onClick={() => setEditing(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Emoji + Name */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emoji}
                  onChange={e => setEmoji(e.target.value)}
                  className="w-14 text-center text-xl border border-gray-200 rounded-xl px-2 py-2"
                />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Item name"
                  className={inputClass + ' flex-1'}
                />
              </div>

              {/* Category */}
              <select value={cat} onChange={e => setCat(e.target.value as typeof CATEGORIES[number])} className={inputClass}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>

              {/* Price */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {lang === 'id' ? 'Rp' : '€'}
                </span>
                <input
                  type="number"
                  value={price}
                  min="0"
                  step={lang === 'id' ? '500' : '0.01'}
                  onChange={e => setPrice(e.target.value)}
                  className={inputClass + ' pl-8'}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSave}
                disabled={pending || !name || !price}
                className="flex-1 flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
