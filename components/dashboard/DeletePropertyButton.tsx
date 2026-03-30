'use client'

import { useTransition } from 'react'
import { deleteProperty } from '@/app/actions/properties'
import { Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function DeletePropertyButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition()
  const { t } = useI18n()

  function handleDelete() {
    if (!confirm(t.properties.deleteConfirm.replace('$name', name))) return
    startTransition(() => { void deleteProperty(id) })
  }

  return (
    <button
      disabled={pending}
      onClick={handleDelete}
      className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ml-auto"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {t.properties.delete}
    </button>
  )
}
