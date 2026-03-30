'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createCatalogItem } from '@/app/actions/pos'
import { Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white'

function SubmitBtn() {
  const { pending } = useFormStatus()
  const { t } = useI18n()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
    >
      {pending
        ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" /></svg>
        : <Plus className="w-4 h-4" />}
      {t.catalog.addItem}
    </button>
  )
}

export default function AddCatalogItemForm() {
  const { t } = useI18n()
  const pos = t.pos
  const [state, formAction] = useFormState(createCatalogItem, null)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-700 text-sm mb-4">{t.catalog.addNewItem}</h2>

      {state?.error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 bg-jungle-50 border border-jungle-200 text-jungle-700 text-xs px-3 py-2 rounded-xl">
          {t.catalog.itemAdded}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap gap-3">
        <input name="emoji" type="text" placeholder="🍹" defaultValue="🛍️" className="w-16 text-center" style={{ fontSize: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.5rem' }} />

        <div className="flex-1 min-w-40">
          <input name="name" type="text" required placeholder="Bintang Beer" className={inputClass} />
        </div>

        <select name="category" required className={inputClass + ' w-36'}>
          <option value="food">{pos.categories.food}</option>
          <option value="drinks">{pos.categories.drinks}</option>
          <option value="tours">{pos.categories.tours}</option>
          <option value="transport">{pos.categories.transport}</option>
          <option value="wellness">{pos.categories.wellness}</option>
          <option value="other">{pos.categories.other}</option>
        </select>

        <div className="relative w-28">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
          <input name="default_price" type="number" required min="0" step="0.01" placeholder="4.50" className={inputClass + ' pl-7'} />
        </div>

        <SubmitBtn />
      </form>
    </div>
  )
}
