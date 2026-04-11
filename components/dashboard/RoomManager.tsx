'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Pencil, Check, X, BedDouble, Layers } from 'lucide-react'
import { createRoom, updateRoom, deleteRoom, toggleRoomActive } from '@/app/actions/rooms'
import type { Room, ListingVariant } from '@/lib/types'

const STATUS_STYLE: Record<string, { label: string; dot: string }> = {
  available:      { label: 'Available',      dot: 'bg-jungle-500' },
  occupied:       { label: 'Occupied',        dot: 'bg-blue-500' },
  needs_cleaning: { label: 'Needs cleaning',  dot: 'bg-amber-500' },
  maintenance:    { label: 'Maintenance',     dot: 'bg-red-400' },
}

interface RoomFormState {
  room_number: string
  name:        string
  floor:       string
  variant_id:  string
}

function blank(defaultVariantId: string): RoomFormState {
  return { room_number: '', name: '', floor: '', variant_id: defaultVariantId }
}

function RoomForm({
  initial,
  variants,
  onSave,
  onCancel,
  saving,
}: {
  initial:  RoomFormState
  variants: ListingVariant[]
  onSave:   (d: RoomFormState) => void
  onCancel: () => void
  saving:   boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof RoomFormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="border border-jungle-200 bg-jungle-50/40 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Room number *</label>
          <input
            type="text"
            value={form.room_number}
            onChange={e => set('room_number', e.target.value)}
            placeholder="101"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Name (optional)</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Garden view"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Floor</label>
          <input
            type="number"
            value={form.floor}
            onChange={e => set('floor', e.target.value)}
            placeholder="1"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Room type *</label>
          <select
            value={form.variant_id}
            onChange={e => set('variant_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500 bg-white"
          >
            <option value="">— select —</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.room_number || !form.variant_id}
          className="flex items-center gap-1.5 bg-jungle-700 hover:bg-jungle-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? 'Saving…' : 'Save room'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function RoomManager({
  propertyId,
  initialRooms,
  variants,
}: {
  propertyId:    string
  initialRooms:  Room[]
  variants:      ListingVariant[]
}) {
  const [rooms, setRooms]       = useState<Room[]>(initialRooms)
  const [showAdd, setShowAdd]   = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [saving, startTransition] = useTransition()

  const defaultVariantId = variants[0]?.id ?? ''

  // Group rooms by variant
  const grouped = variants.map(v => ({
    variant: v,
    rooms:   rooms.filter(r => r.variant_id === v.id).sort((a, b) => a.sort_order - b.sort_order || a.room_number.localeCompare(b.room_number)),
  }))
  const unassigned = rooms.filter(r => !r.variant_id)

  function handleAdd(form: RoomFormState) {
    startTransition(async () => {
      const res = await createRoom({
        property_id: propertyId,
        variant_id:  form.variant_id || null,
        room_number: form.room_number,
        name:        form.name || undefined,
        floor:       form.floor ? parseInt(form.floor) : null,
        sort_order:  rooms.length,
      })
      if (!res?.error) {
        // Optimistic: add a placeholder (server will revalidate with real data)
        setRooms(prev => [...prev, {
          id:          crypto.randomUUID(),
          owner_id:    '',
          property_id: propertyId,
          variant_id:  form.variant_id || null,
          room_number: form.room_number,
          name:        form.name || null,
          floor:       form.floor ? parseInt(form.floor) : null,
          status:      'available',
          notes:       null,
          is_active:   true,
          sort_order:  rooms.length,
          created_at:  new Date().toISOString(),
        }])
        setShowAdd(false)
      }
    })
  }

  function handleEdit(id: string, form: RoomFormState) {
    startTransition(async () => {
      await updateRoom(id, propertyId, {
        room_number: form.room_number,
        name:        form.name || null,
        floor:       form.floor ? parseInt(form.floor) : null,
        variant_id:  form.variant_id || null,
      })
      setRooms(prev => prev.map(r => r.id === id
        ? { ...r, room_number: form.room_number, name: form.name || null, floor: form.floor ? parseInt(form.floor) : null, variant_id: form.variant_id || null }
        : r
      ))
      setEditId(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteRoom(id, propertyId)
      if (res?.error) { alert(res.error); return }
      setRooms(prev => prev.filter(r => r.id !== id))
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleRoomActive(id, propertyId, !current)
      setRooms(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r))
    })
  }

  function RoomRow({ room }: { room: Room }) {
    const st = STATUS_STYLE[room.status]
    return editId === room.id ? (
      <RoomForm
        key={room.id}
        initial={{ room_number: room.room_number, name: room.name ?? '', floor: room.floor ? String(room.floor) : '', variant_id: room.variant_id ?? '' }}
        variants={variants}
        onSave={form => handleEdit(room.id, form)}
        onCancel={() => setEditId(null)}
        saving={saving}
      />
    ) : (
      <div key={room.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${room.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BedDouble className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">
              Room {room.room_number}
              {room.name && <span className="font-normal text-gray-500 ml-1.5">· {room.name}</span>}
            </p>
            {room.floor != null && <p className="text-[11px] text-gray-400">Floor {room.floor}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
          <span className="text-xs text-gray-500 hidden sm:inline">{st.label}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => handleToggle(room.id, room.is_active)}
            disabled={saving}
            className={`relative w-8 h-4 rounded-full transition-colors ${room.is_active ? 'bg-jungle-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${room.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <button onClick={() => setEditId(room.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(room.id)} disabled={saving} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Rooms</h3>
          <p className="text-xs text-gray-400 mt-0.5">Physical rooms linked to a room type. These are used for booking assignment and availability.</p>
        </div>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold bg-jungle-800 hover:bg-jungle-900 text-white px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add room
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <RoomForm
          initial={blank(defaultVariantId)}
          variants={variants}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={saving}
        />
      )}

      {/* Grouped by variant */}
      {grouped.map(({ variant, rooms: vRooms }) => (
        <div key={variant.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-jungle-600" />
            <p className="text-xs font-bold text-jungle-700 uppercase tracking-wider">{variant.name}</p>
            <span className="text-xs text-gray-400">({vRooms.length} room{vRooms.length !== 1 ? 's' : ''})</span>
          </div>
          {vRooms.length === 0 ? (
            <p className="text-xs text-gray-400 pl-5">No rooms yet for this type.</p>
          ) : (
            <div className="space-y-1.5 pl-1">
              {vRooms.map(room => <RoomRow key={room.id} room={room} />)}
            </div>
          )}
        </div>
      ))}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No room type assigned</p>
          <div className="space-y-1.5">
            {unassigned.map(room => <RoomRow key={room.id} room={room} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {rooms.length === 0 && !showAdd && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-gray-200 hover:border-jungle-300 text-gray-400 hover:text-jungle-600 rounded-xl py-8 text-sm font-medium transition-colors flex flex-col items-center gap-2"
        >
          <BedDouble className="w-5 h-5" />
          Add your first room
        </button>
      )}
    </div>
  )
}
