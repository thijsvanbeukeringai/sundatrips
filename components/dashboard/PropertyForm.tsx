'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createProperty, updateProperty } from '@/app/actions/properties'
import type { Property } from '@/lib/types'
import { ArrowLeft, Save, User, Phone } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import ImageUploader from './ImageUploader'
import AmenitiesSelector from './AmenitiesSelector'
import LocationAutocomplete from './LocationAutocomplete'
import { useI18n } from '@/lib/i18n'

interface Props {
  userId:          string
  property?:       Property
  allowedTypes?:   string[]
  defaultVenueId?: string
  backHref?:       string
  createAction?:   (prev: unknown, formData: FormData) => Promise<{ error?: string } | null>
  updateAction?:   (prev: unknown, formData: FormData) => Promise<{ error?: string } | null>
}

const labelClass = 'block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5'
const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition'
const selectClass = inputClass + ' bg-white'

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  const { t } = useI18n()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 active:scale-[0.98]"
    >
      {pending ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
      ) : (
        <Save className="w-4 h-4" />
      )}
      {pending ? t.form.saving : isEdit ? t.form.saveChanges : t.form.createListing}
    </button>
  )
}

export default function PropertyForm({ userId, property, allowedTypes, defaultVenueId, backHref, createAction: customCreate, updateAction: customUpdate }: Props) {
  const { t } = useI18n()
  const isEdit = !!property
  const backLink = backHref ?? '/dashboard/properties'
  const action = isEdit ? (customUpdate ?? updateProperty) : (customCreate ?? createProperty)
  const [state, formAction] = useFormState(action, null)
  const [images,       setImages]       = useState<string[]>(property?.images ?? [])
  const [amenities,    setAmenities]    = useState<string[]>(property?.amenities ?? [])
  const [distanceKm,   setDistanceKm]   = useState<string>(property?.distance_km ? String(property.distance_km) : '')
  const [estimatedHrs, setEstimatedHrs] = useState<string>(property?.duration_hours ? String(property.duration_hours) : '')
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [toCoords,   setToCoords]   = useState<{ lat: number; lon: number } | null>(null)
  const [privateTour, setPrivateTour] = useState(property?.private_tour_available ?? false)

  const ALL_TYPES = [
    { value: 'stay',     label: t.form.types.stay },
    { value: 'trip',     label: t.form.types.trip },
    { value: 'activity', label: t.form.types.activity },
    { value: 'transfer', label: t.form.types.transfer },
  ]

  const permitted = allowedTypes ?? ALL_TYPES.map(t => t.value)
  const visibleTypes = ALL_TYPES.filter(t => permitted.includes(t.value))
  const defaultType = property?.type ?? (visibleTypes[0]?.value as any ?? 'stay')
  const [type, setType] = useState(defaultType)

  // Auto-calculate distance from coordinates when both points are selected
  useEffect(() => {
    if (!fromCoords || !toCoords) return
    const R = 6371
    const dLat = (toCoords.lat - fromCoords.lat) * Math.PI / 180
    const dLon = (toCoords.lon - fromCoords.lon) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(fromCoords.lat * Math.PI / 180) *
              Math.cos(toCoords.lat   * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2
    const km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
    setDistanceKm(String(km))
  }, [fromCoords, toCoords])

  // Auto-calculate duration from distance
  useEffect(() => {
    if (type !== 'transfer' || !distanceKm) return
    const km = parseFloat(distanceKm)
    if (!isNaN(km) && km > 0) {
      const rounded = Math.round((km / 50) * 2) / 2
      setEstimatedHrs(String(Math.max(0.5, rounded)))
    }
  }, [distanceKm, type])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href={backLink} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-jungle-800">
            {isEdit ? `${t.form.editListing} "${property.name}"` : t.form.newListing}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isEdit ? t.form.editSub : t.form.createSub}
          </p>
        </div>
      </div>

      {state?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {isEdit && <input type="hidden" name="id" value={property.id} />}
        {!isEdit && defaultVenueId && <input type="hidden" name="venue_id" value={defaultVenueId} />}
        <input type="hidden" name="images"    value={images.join('\n')} />
        <input type="hidden" name="amenities" value={amenities.join(',')} />

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{t.form.basicInfo}</h2>

          <div>
            <label className={labelClass}>{t.form.name} *</label>
            <input name="name" type="text" required defaultValue={property?.name} placeholder={t.form.namePlaceholder} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t.form.type} *</label>
              <select name="type" required value={type} onChange={e => setType(e.target.value as any)} className={selectClass}>
                {visibleTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.form.island} *</label>
              <select name="island" required defaultValue={property?.island ?? 'Lombok'} className={selectClass}>
                <option value="Lombok">{t.form.islands.lombok}</option>
                <option value="Bali">{t.form.islands.bali}</option>
                <option value="Gili Islands">{t.form.islands.giliIslands}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t.form.location} *</label>
            <input name="location" type="text" required defaultValue={property?.location} placeholder={t.form.locationPH} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t.form.description}</label>
            <textarea name="description" rows={3} defaultValue={property?.description ?? ''} placeholder={t.form.descriptionPH} className={inputClass + ' resize-none'} />
          </div>

          <div>
            <label className={labelClass}>{t.form.tag}</label>
            <input name="tag" type="text" defaultValue={property?.tag ?? ''} placeholder={t.form.tagPH} className={inputClass} />
            <p className="text-[11px] text-gray-400 mt-1">{t.form.tagHelper}</p>
          </div>

          {type === 'transfer' && (
            <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t.form.transferDetails}</p>

              {/* From → To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.form.from}</label>
                  <LocationAutocomplete
                    name="transfer_from"
                    defaultValue={property?.transfer_from ?? ''}
                    placeholder={t.form.fromPH}
                    className={inputClass}
                    onSelect={(_, lat, lon) => setFromCoords({ lat, lon })}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.form.to}</label>
                  <LocationAutocomplete
                    name="transfer_to"
                    defaultValue={property?.transfer_to ?? ''}
                    placeholder={t.form.toPH}
                    className={inputClass}
                    onSelect={(_, lat, lon) => setToCoords({ lat, lon })}
                  />
                </div>
              </div>

              {/* Distance + estimated time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.form.distanceKm}</label>
                  <input
                    name="distance_km"
                    type="number"
                    min="0"
                    step="0.1"
                    value={distanceKm}
                    onChange={e => setDistanceKm(e.target.value)}
                    placeholder={t.form.distanceKmPH}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{t.form.distanceHelper}</p>
                </div>
                <div>
                  <label className={labelClass}>{t.form.durationHours}</label>
                  <input
                    name="duration_hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimatedHrs}
                    onChange={e => setEstimatedHrs(e.target.value)}
                    placeholder="1.5"
                    className={inputClass}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{t.form.durationHelper}</p>
                </div>
              </div>

              {/* Price per km (custom route) */}
              <div>
                <label className={labelClass}>Price per km (IDR)</label>
                <input
                  name="price_per_km"
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={property?.price_per_km ?? 12500}
                  placeholder="12500"
                  className={inputClass}
                />
                <p className="text-[11px] text-gray-400 mt-1">Used to calculate custom route prices. Default: 12,500 IDR/km.</p>
              </div>

              {/* English-speaking toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="english_speaking"
                  defaultChecked={property?.english_speaking ?? false}
                  className="w-4 h-4 rounded border-gray-300 text-jungle-600 focus:ring-jungle-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.form.englishSpeaking}</p>
                  <p className="text-xs text-gray-400">{t.form.englishHelper}</p>
                </div>
              </label>

              {/* Driver info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Driver name</span>
                  </label>
                  <input
                    name="driver_name"
                    type="text"
                    defaultValue={property?.driver_name ?? ''}
                    placeholder="Made Suardika"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone / WhatsApp</span>
                  </label>
                  <input
                    name="driver_phone"
                    type="text"
                    defaultValue={property?.driver_phone ?? ''}
                    placeholder="+62 812 3456 7890"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing — hidden for stays (price lives in room types) */}
        {type === 'stay' ? (
          <>
            {/* Hidden defaults so DB NOT NULL constraint is satisfied */}
            <input type="hidden" name="price_per_unit" value="0" />
            <input type="hidden" name="price_unit" value="night" />
            <div className="bg-jungle-50 border border-jungle-100 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-jungle-600 text-lg mt-0.5">💡</span>
              <div>
                <p className="text-sm font-semibold text-jungle-800">Pricing is set per room type</p>
                <p className="text-xs text-jungle-600 mt-0.5">After saving, go to <strong>Room Types</strong> to add rooms (e.g. Standard Room, Deluxe Villa) each with their own nightly rate.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{t.form.pricing}</h2>
            {type === 'transfer' && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5">
                <span className="text-amber-500 text-sm mt-0.5">💡</span>
                <p className="text-xs text-amber-700">Optional for transfers. If you set a fixed price here, the per-km price calculation will not apply for this route.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.form.price}{type !== 'transfer' ? ' *' : ''}</label>
                <input name="price_per_unit" type="number" required={type !== 'transfer'} min="0" step="0.01" defaultValue={property?.price_per_unit} placeholder={type === 'transfer' ? '0' : '48'} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.form.per} *</label>
                <select
                  name="price_unit"
                  required
                  defaultValue={property?.price_unit ?? (type === 'transfer' ? 'trip' : 'person')}
                  className={selectClass}
                >
                  {type === 'transfer' ? (
                    <>
                      <option value="trip">{t.form.units.trip}</option>
                      <option value="vehicle">{t.form.units.vehicle}</option>
                      <option value="person">{t.form.units.person}</option>
                    </>
                  ) : (
                    <>
                      <option value="person">{t.form.units.person}</option>
                      <option value="session">{t.form.units.session}</option>
                      <option value="day">{t.form.units.day}</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{t.form.details}</h2>

          <div>
            <label className={labelClass}>
              {type === 'transfer' ? t.form.passengerCapacity : t.form.maxCapacity}
            </label>
            <input
              name="max_capacity"
              type="number"
              min="1"
              defaultValue={property?.max_capacity ?? ''}
              placeholder={type === 'stay' ? `4 ${t.form.guestsPlaceholder}` : `8 ${t.form.peoplePlaceholder}`}
              className={inputClass}
            />
          </div>
          {type !== 'stay' && type !== 'transfer' && (
            <>
              <div>
                <label className={labelClass}>{t.form.durationHours}</label>
                <input name="duration_hours" type="number" min="0.5" step="0.5" defaultValue={property?.duration_hours ?? ''} placeholder="4" className={inputClass} />
                <p className="text-[11px] text-gray-400 mt-1">{t.form.durationHelper}</p>
              </div>
              <div>
                <label className={labelClass}>{t.form.durationLabel}</label>
                <input name="duration" type="text" defaultValue={property?.duration ?? ''} placeholder={t.form.durationLabelPH} className={inputClass} />
                <p className="text-[11px] text-gray-400 mt-1">{t.form.durationLabelHelper}</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input type="checkbox" name="pickup_available" defaultChecked={property?.pickup_available ?? false} className="w-4 h-4 rounded border-gray-300 text-jungle-600 focus:ring-jungle-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.form.pickupAvailable ?? 'Hotel pickup available'}</p>
                  <p className="text-xs text-gray-400">{t.form.pickupAvailableHelper ?? 'Guests can enter their hotel for pickup'}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="private_tour_available"
                  checked={privateTour}
                  onChange={e => setPrivateTour(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-jungle-600 focus:ring-jungle-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.form.privateTour ?? 'Private tour available'}</p>
                  <p className="text-xs text-gray-400">{t.form.privateTourHelper ?? 'Guests can book the full activity as a private group'}</p>
                </div>
              </label>
              {privateTour && (
                <div>
                  <label className={labelClass}>{t.form.privateTourPrice ?? 'Private tour price (Rp)'}</label>
                  <input
                    name="private_tour_price"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={property?.private_tour_price ?? ''}
                    placeholder="1500000"
                    className={inputClass}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{t.form.privateTourPriceHelper ?? 'Fixed price for the entire group (regardless of group size)'}</p>
                </div>
              )}
            </>
          )}

          <div>
            <label className={labelClass}>{t.form.images}</label>
            <ImageUploader
              userId={userId}
              initialUrls={property?.images ?? []}
              onChange={setImages}
            />
          </div>

          {/* Amenities — hidden for transfers (set in partner profile settings) */}
          {type !== 'transfer' && (
            <div>
              <label className={labelClass}>{t.form.amenities}</label>
              <AmenitiesSelector
                type={type as any}
                initial={property?.amenities ?? []}
                onChange={setAmenities}
              />
            </div>
          )}
          {type === 'transfer' && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500">
              Amenities and highlights are managed in your <strong>Profile Settings</strong>.
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="is_active" defaultChecked={property?.is_active ?? true} className="w-4 h-4 rounded border-gray-300 text-jungle-600 focus:ring-jungle-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{t.form.active}</p>
              <p className="text-xs text-gray-400">{t.form.activeHelper}</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pb-8">
          <SubmitButton isEdit={isEdit} />
          <Link href={backLink} className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            {t.form.cancel}
          </Link>
        </div>
      </form>
    </div>
  )
}
