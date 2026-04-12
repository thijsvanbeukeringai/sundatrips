'use client'

import { useState, useEffect } from 'react'
import { getPartnerOwnedServices, togglePartnerServiceActive, deletePartnerService } from '@/app/actions/partner'
import { Compass, Car, MapPin, Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Property } from '@/lib/types'

const typeIcons: Record<string, typeof Compass> = {
  trip: Compass,
  activity: Compass,
  transfer: Car,
}

const typeLabels: Record<string, string> = {
  trip: 'Trip',
  activity: 'Activity',
  transfer: 'Transfer',
  stay: 'Stay',
}

export default function PartnerServicesPage() {
  const [services, setServices] = useState<Property[]>([])
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    getPartnerOwnedServices().then(data => {
      setServices(data)
      setLoading(false)
    })
  }, [])

  async function handleToggle(id: string, currentActive: boolean) {
    setToggling(id)
    await togglePartnerServiceActive(id, !currentActive)
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentActive } : s))
    setToggling(null)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    await deletePartnerService(id)
    setServices(prev => prev.filter(s => s.id !== id))
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    )
  }

  const activeCount = services.filter(s => s.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {services.length} service{services.length !== 1 ? 's' : ''} · {activeCount} active
          </p>
        </div>
        <Link
          href="/portal/services/new"
          className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 active:scale-[0.98] text-sm"
        >
          <Plus className="w-4 h-4" />
          New Service
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-jungle-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6 text-jungle-600" />
          </div>
          <p className="text-gray-500 text-sm mb-4">You don't have any services yet.</p>
          <Link
            href="/portal/services/new"
            className="inline-flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create your first service
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(service => {
            const Icon = typeIcons[service.type] ?? Compass
            const isToggling = toggling === service.id
            const isDeleting = deleting === service.id

            return (
              <div
                key={service.id}
                className={`bg-white border rounded-2xl p-5 transition-colors ${
                  service.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      service.is_active ? 'bg-jungle-50' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${service.is_active ? 'text-jungle-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {typeLabels[service.type]}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {service.location}
                        </span>
                      </div>
                      {service.price_per_unit > 0 && (
                        <p className="text-sm font-semibold text-jungle-700 mt-1.5">
                          €{service.price_per_unit} / {service.price_unit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(service.id, service.is_active)}
                      disabled={isToggling}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-jungle-700 hover:border-jungle-300 disabled:opacity-50 transition-colors"
                      title={service.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {isToggling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : service.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      href={`/portal/services/${service.id}/edit`}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-jungle-700 hover:border-jungle-300 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(service.id, service.name)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 disabled:opacity-50 transition-colors"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
