'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, Pencil, Check, X, Users, ArrowRight, Car, Phone, Building2 } from 'lucide-react'
import { addVariant, updateVariant, deleteVariant, toggleVariantActive } from '@/app/actions/variants'
import type { ListingVariant, PropertyType } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import ImageUploader from './ImageUploader'

// ─── Blank form state ─────────────────────────────────────────────────────────

function blankForm(type: PropertyType, priceUnit: string) {
  return {
    name:           '',
    description:    '',
    price_per_unit: '',
    price_unit:     priceUnit,
    max_capacity:   '',
    from_location:  '',
    to_location:    '',
    vehicle_type:   '',
    driver_name:    '',
    driver_phone:   '',
    images:         [] as string[],
  }
}

// ─── Inline form ─────────────────────────────────────────────────────────────

interface FormState {
  name:          string
  description:   string
  price_per_unit: string
  price_unit:    string
  max_capacity:  string
  from_location: string
  to_location:   string
  vehicle_type:  string
  driver_name:   string
  driver_phone:  string
  images:        string[]
}

function VariantForm({
  type,
  initial,
  onSave,
  onCancel,
  saving,
  userId,
}: {
  type:     PropertyType
  initial:  FormState
  onSave:   (data: FormState) => void
  onCancel: () => void
  saving:   boolean
  userId:   string
}) {
  const { t } = useI18n()
  const vm = t.variantManager
  const vt = t.variants
  const [form, setForm] = useState<FormState>(initial)
  const isTransfer = type === 'transfer'

  const PRICE_UNITS: Record<PropertyType, { value: string; label: string }[]> = {
    stay:     [{ value: 'night', label: vt.perNight }, { value: 'day', label: vt.perDay }],
    trip:     [{ value: 'person', label: vt.perPerson }, { value: 'session', label: vt.perSession }],
    activity: [{ value: 'person', label: vt.perPerson }, { value: 'session', label: vt.perSession }],
    transfer: [{ value: 'trip', label: vt.perTrip }, { value: 'vehicle', label: vt.perVehicle }, { value: 'person', label: vt.perPerson }],
  }

  const PLACEHOLDER: Record<PropertyType, string> = {
    stay:     vt.phStay,
    trip:     vt.phTrip,
    activity: vt.phActivity,
    transfer: vt.phTransfer,
  }

  const units = PRICE_UNITS[type]

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  return (
    <div className="border border-jungle-200 bg-jungle-50/40 rounded-xl p-4 space-y-3">
      {/* Name */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.name} *</label>
        <input
          type="text"
          placeholder={PLACEHOLDER[type]}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
        />
      </div>

      {/* Transfer: from → to */}
      {isTransfer && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.from}</label>
              <input
                type="text"
                placeholder={vm.fromPH}
                value={form.from_location}
                onChange={e => set('from_location', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.to}</label>
              <input
                type="text"
                placeholder={vm.toPH}
                value={form.to_location}
                onChange={e => set('to_location', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
              />
            </div>
          </div>

          {/* Chauffeur info */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{vm.chauffeurTitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.vehicleType}</label>
                <input
                  type="text"
                  placeholder={vm.vehicleTypePH}
                  value={form.vehicle_type}
                  onChange={e => set('vehicle_type', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.driverName}</label>
                <input
                  type="text"
                  placeholder={vm.driverNamePH}
                  value={form.driver_name}
                  onChange={e => set('driver_name', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.driverPhone}</label>
                <input
                  type="tel"
                  placeholder={vm.driverPhonePH}
                  value={form.driver_phone}
                  onChange={e => set('driver_phone', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.description}</label>
        <textarea
          placeholder={vm.descPH}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500 resize-none"
        />
      </div>

      {/* Photos */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Photos</label>
        <ImageUploader
          userId={userId}
          initialUrls={form.images}
          onChange={imgs => setForm(f => ({ ...f, images: imgs }))}
        />
      </div>

      {/* Price + Unit + Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.price} *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.price_per_unit}
            onChange={e => set('price_per_unit', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">{vm.unit}</label>
          <select
            value={form.price_unit}
            onChange={e => set('price_unit', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500 bg-white"
          >
            {units.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            {isTransfer ? vm.maxPax : vm.maxGuests}
          </label>
          <input
            type="number"
            min="1"
            placeholder="—"
            value={form.max_capacity}
            onChange={e => set('max_capacity', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.name || !form.price_per_unit}
          className="flex items-center gap-1.5 bg-jungle-700 hover:bg-jungle-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? vm.saving : vm.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          {vm.cancel}
        </button>
      </div>
    </div>
  )
}

// ─── Variant card ─────────────────────────────────────────────────────────────

function VariantCard({
  variant,
  onEdit,
  onDelete,
  onToggle,
}: {
  variant:  ListingVariant
  type:     PropertyType
  onEdit:   () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className={`rounded-xl border transition-colors ${
      variant.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
    }`}>
      {/* Main info row */}
      <div className="flex items-start gap-3 p-4">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          {variant.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={variant.images[0]} alt={variant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Building2 className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900">{variant.name}</p>
            {variant.from_location && variant.to_location && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {variant.from_location}
                <ArrowRight className="w-3 h-3" />
                {variant.to_location}
              </span>
            )}
          </div>
          {variant.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{variant.description}</p>
          )}
          <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 flex-wrap">
            <span className="font-bold text-jungle-800">Rp {Math.round(variant.price_per_unit).toLocaleString('id-ID')} / {variant.price_unit}</span>
            {variant.max_capacity && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Max {variant.max_capacity}
              </span>
            )}
            {variant.vehicle_type && (
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3" />
                {variant.vehicle_type}
              </span>
            )}
            {variant.driver_name && (
              <span className="text-gray-400">{variant.driver_name}</span>
            )}
            {variant.driver_phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {variant.driver_phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => startTransition(() => { void onDelete() })}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
        <button
          onClick={() => startTransition(() => { void onToggle() })}
          disabled={pending}
          className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
            variant.is_active ? 'bg-jungle-600' : 'bg-gray-300'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            variant.is_active ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VariantManager({
  propertyId,
  propertyType,
  initialVariants,
  userId,
}: {
  propertyId:       string
  propertyType:     PropertyType
  initialVariants:  ListingVariant[]
  userId:           string
}) {
  const { t } = useI18n()
  const vt = t.variants
  const vm = t.variantManager

  const VARIANT_LABELS: Record<PropertyType, { title: string; addLabel: string }> = {
    stay:     { title: vt.stay,     addLabel: vt.addStay },
    trip:     { title: vt.trip,     addLabel: vt.addTrip },
    activity: { title: vt.activity, addLabel: vt.addActivity },
    transfer: { title: vt.transfer, addLabel: vt.addTransfer },
  }

  const PRICE_UNITS: Record<PropertyType, string> = {
    stay:     'night',
    trip:     'person',
    activity: 'person',
    transfer: 'trip',
  }

  const [variants, setVariants] = useState<ListingVariant[]>(initialVariants)
  const [showAdd, setShowAdd]   = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [saving, startTransition] = useTransition()
  const addFormRef = useRef<HTMLDivElement>(null)

  const cfg = VARIANT_LABELS[propertyType]

  function handleAdd(form: FormState) {
    startTransition(async () => {
      const data = {
        name:           form.name,
        description:    form.description,
        price_per_unit: parseFloat(form.price_per_unit),
        price_unit:     form.price_unit,
        max_capacity:   form.max_capacity ? parseInt(form.max_capacity) : null,
        from_location:  form.from_location,
        to_location:    form.to_location,
        vehicle_type:   form.vehicle_type,
        driver_name:    form.driver_name,
        driver_phone:   form.driver_phone,
        amenities:      [],
        images:         form.images,
      }
      await addVariant(propertyId, data)
      setVariants(v => [...v, {
        ...data,
        id:           crypto.randomUUID(),
        property_id:  propertyId,
        owner_id:     '',
        vehicle_type: form.vehicle_type || null,
        driver_name:  form.driver_name  || null,
        driver_phone: form.driver_phone || null,
        is_active:    true,
        sort_order:   v.length,
        created_at:   new Date().toISOString(),
      }])
      setShowAdd(false)
    })
  }

  function handleEdit(id: string, form: FormState) {
    startTransition(async () => {
      const data = {
        name:           form.name,
        description:    form.description,
        price_per_unit: parseFloat(form.price_per_unit),
        price_unit:     form.price_unit,
        max_capacity:   form.max_capacity ? parseInt(form.max_capacity) : null,
        from_location:  form.from_location,
        to_location:    form.to_location,
        vehicle_type:   form.vehicle_type,
        driver_name:    form.driver_name,
        driver_phone:   form.driver_phone,
        images:         form.images,
      }
      await updateVariant(id, propertyId, data)
      setVariants(v => v.map(x => x.id === id ? { ...x, ...data, vehicle_type: form.vehicle_type || null, driver_name: form.driver_name || null, driver_phone: form.driver_phone || null } : x))
      setEditId(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteVariant(id, propertyId)
      setVariants(v => v.filter(x => x.id !== id))
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleVariantActive(id, propertyId, !current)
      setVariants(v => v.map(x => x.id === id ? { ...x, is_active: !current } : x))
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">{cfg.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{vm.helper}</p>
        </div>
        {!showAdd && (
          <button
            type="button"
            onClick={() => {
              setShowAdd(true)
              setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
            }}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold bg-jungle-800 hover:bg-jungle-900 text-white px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {cfg.addLabel}
          </button>
        )}
      </div>

      {/* Existing variants */}
      <div className="space-y-2">
        {variants.map(v =>
          editId === v.id ? (
            <VariantForm
              key={v.id}
              type={propertyType}
              userId={userId}
              initial={{
                name:          v.name,
                description:   v.description  ?? '',
                price_per_unit: String(v.price_per_unit),
                price_unit:    v.price_unit,
                max_capacity:  v.max_capacity ? String(v.max_capacity) : '',
                from_location: v.from_location ?? '',
                to_location:   v.to_location   ?? '',
                vehicle_type:  v.vehicle_type  ?? '',
                driver_name:   v.driver_name   ?? '',
                driver_phone:  v.driver_phone  ?? '',
                images:        v.images ?? [],
              }}
              onSave={form => handleEdit(v.id, form)}
              onCancel={() => setEditId(null)}
              saving={saving}
            />
          ) : (
            <VariantCard
              key={v.id}
              variant={v}
              type={propertyType}
              onEdit={() => setEditId(v.id)}
              onDelete={() => handleDelete(v.id)}
              onToggle={() => handleToggle(v.id, v.is_active)}
            />
          )
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div ref={addFormRef}>
          <VariantForm
            type={propertyType}
            userId={userId}
            initial={blankForm(propertyType, PRICE_UNITS[propertyType])}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
            saving={saving}
          />
        </div>
      )}

      {variants.length === 0 && !showAdd && (
        <button
          type="button"
          onClick={() => {
            setShowAdd(true)
            setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
          }}
          className="w-full border-2 border-dashed border-gray-200 hover:border-jungle-300 text-gray-400 hover:text-jungle-600 rounded-xl py-8 text-sm font-medium transition-colors flex flex-col items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {cfg.addLabel}
        </button>
      )}
    </div>
  )
}
