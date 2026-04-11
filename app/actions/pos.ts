'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPOSItem(
  bookingId: string,
  item: { name: string; category: string; unit_price: number; quantity: number; catalog_id?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('pos_items').insert({
    booking_id: bookingId,
    owner_id:   user.id,
    catalog_id: item.catalog_id ?? null,
    name:       item.name,
    category:   item.category,
    unit_price: item.unit_price,
    quantity:   item.quantity,
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  return { success: true }
}

export async function removePOSItem(itemId: string, bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('pos_items')
    .delete()
    .eq('id', itemId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  return { success: true }
}

export async function createCatalogItem(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('pos_catalog').insert({
    owner_id:      user.id,
    name:          formData.get('name') as string,
    category:      formData.get('category') as string,
    default_price: parseFloat(formData.get('default_price') as string),
    emoji:         (formData.get('emoji') as string) || '🛍️',
    is_active:     true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pos')
  return { success: true }
}

// Used by the controlled form which converts currency client-side before calling this
export async function createCatalogItemDirect(data: {
  name:          string
  category:      string
  emoji:         string
  default_price: number   // always EUR
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('pos_catalog').insert({
    owner_id:      user.id,
    name:          data.name,
    category:      data.category,
    default_price: data.default_price,
    emoji:         data.emoji || '🛍️',
    is_active:     true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pos')
  return { success: true }
}

export async function updateCatalogItem(
  id: string,
  data: { name: string; category: string; default_price: number; emoji: string },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('pos_catalog')
    .update(data)
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pos')
  return { success: true }
}

export async function toggleCatalogItem(id: string, is_active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('pos_catalog')
    .update({ is_active })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pos')
  return { success: true }
}

export async function markExtrasPaid(bookingId: string, baseAmount = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Fetch current POS items
  const { data: items } = await supabase
    .from('pos_items')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })

  // Prepend room charge on first bill (baseAmount > 0)
  const roomItem = baseAmount > 0
    ? [{ name: 'Room rate', category: 'room', unit_price: baseAmount, quantity: 1, total_price: baseAmount }]
    : []
  const allItems = [...roomItem, ...(items ?? [])]

  if (allItems.length === 0) return { error: 'No items on bill' }

  const total = allItems.reduce((s: number, i: { total_price: number }) => s + i.total_price, 0)

  // 2. Snapshot to bill_payments
  const { error: snapErr } = await supabase.from('bill_payments').insert({
    booking_id:   bookingId,
    owner_id:     user.id,
    items:        allItems,
    total_amount: total,
  })
  if (snapErr) return { error: snapErr.message }

  // 3. Delete all POS items — extras_amount auto-resets to 0 via DB trigger
  const { error: delErr } = await supabase
    .from('pos_items')
    .delete()
    .eq('booking_id', bookingId)
    .eq('owner_id', user.id)
  if (delErr) return { error: delErr.message }

  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath('/dashboard/bookings')
  return { success: true }
}

export async function deleteCatalogItem(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('pos_catalog')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pos')
  return { success: true }
}
