'use client'

import { useTransition } from 'react'
import { togglePropertyActive } from '@/app/actions/properties'
import { useI18n } from '@/lib/i18n'

export default function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const { t } = useI18n()

  return (
    <button
      title={isActive ? t.properties.deactivateTitle : t.properties.activateTitle}
      disabled={pending}
      onClick={() => startTransition(() => { void togglePropertyActive(id, !isActive) })}
      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-40 ${
        isActive
          ? 'bg-jungle-600 text-white hover:bg-jungle-700'
          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-gray-400'}`} />
      {isActive ? t.common.active : t.properties.inactive}
    </button>
  )
}
