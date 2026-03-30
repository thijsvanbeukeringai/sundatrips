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

export async function markExtrasPaid(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('bookings')
    .update({ extras_paid: true })
    .eq('id', bookingId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
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
