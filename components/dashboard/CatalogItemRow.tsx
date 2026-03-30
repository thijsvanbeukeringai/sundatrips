'use client'

import { useTransition } from 'react'
import { toggleCatalogItem, deleteCatalogItem } from '@/app/actions/pos'
import type { POSCatalogItem } from '@/lib/types'
import { ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

export default function CatalogItemRow({ item }: { item: POSCatalogItem }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xl flex-shrink-0">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
          {item.name}
        </p>
        <p className="text-xs text-gray-400">€{item.default_price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          disabled={pending}
          title={item.is_active ? 'Deactivate' : 'Activate'}
          onClick={() => startTransition(() => toggleCatalogItem(item.id, !item.is_active))}
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
            if (!confirm(`Delete "${item.name}"?`)) return
            startTransition(() => deleteCatalogItem(item.id))
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
