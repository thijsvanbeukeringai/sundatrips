'use client'

import { useState, useTransition } from 'react'
import { createCatalogItemDirect } from '@/app/actions/pos'
import { Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { EUR_TO_IDR } from '@/lib/currency'

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white'

export default function AddCatalogItemForm() {
  const { t, lang } = useI18n()
  const pos = t.pos

  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')
  const [emoji,   setEmoji]   = useState('🛍️')
  const [name,    setName]    = useState('')
  const [category, setCategory] = useState('food')
  const [price,   setPrice]   = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rawPrice = parseFloat(price)
    if (isNaN(rawPrice) || rawPrice <= 0) return
    const eurPrice = lang === 'id' ? rawPrice / EUR_TO_IDR : rawPrice

    startTransition(async () => {
      const result = await createCatalogItemDirect({ name, category, emoji, default_price: eurPrice })
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setName('')
        setPrice('')
        setEmoji('🛍️')
        setCategory('food')
        setError('')
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-700 text-sm mb-4">{t.catalog.addNewItem}</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{error}</div>
      )}
      {success && (
        <div className="mb-4 bg-jungle-50 border border-jungle-200 text-jungle-700 text-xs px-3 py-2 rounded-xl">{t.catalog.itemAdded}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          type="text"
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          className="w-16 text-center"
          style={{ fontSize: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.5rem' }}
        />

        <div className="flex-1 min-w-40">
          <input
            type="text"
            required
            placeholder="Bintang Beer"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <select
          required
          value={category}
          onChange={e => setCategory(e.target.value)}
          className={inputClass + ' w-36'}
        >
          <option value="food">{pos.categories.food}</option>
          <option value="drinks">{pos.categories.drinks}</option>
          <option value="tours">{pos.categories.tours}</option>
          <option value="transport">{pos.categories.transport}</option>
          <option value="wellness">{pos.categories.wellness}</option>
          <option value="other">{pos.categories.other}</option>
        </select>

        <div className="relative w-28">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {lang === 'id' ? 'Rp' : '€'}
          </span>
          <input
            type="number"
            required
            min="0"
            step={lang === 'id' ? '500' : '0.01'}
            placeholder={lang === 'id' ? '25000' : '4.50'}
            value={price}
            onChange={e => setPrice(e.target.value)}
            className={inputClass + ' pl-7'}
          />
        </div>

        <button
          type="submit"
          disabled={pending || !name || !price}
          className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
        >
          {pending
            ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" /></svg>
            : <Plus className="w-4 h-4" />}
          {t.catalog.addItem}
        </button>
      </form>
    </div>
  )
}
