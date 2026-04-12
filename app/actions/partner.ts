'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Properties ───────────────────────────────────────────────────────────────

export async function getPartnerProperties() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('properties')
    .select('*, variants:listing_variants(*)')
    .eq('partner_id', user.id)
    .eq('is_active', true)
    .order('name')

  return data ?? []
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function getPartnerBookings(filter: 'upcoming' | 'past' | 'all' = 'upcoming') {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('bookings')
    .select(`
      *,
      property:properties(id, name, type, location, island),
      variant:listing_variants(name, price_per_unit, price_unit)
    `)
    .order('check_in', { ascending: filter !== 'past' })

  if (filter === 'upcoming') query = query.gte('check_in', today).neq('status', 'cancelled')
  if (filter === 'past')     query = query.lt('check_in', today)

  const { data } = await query
  return data ?? []
}

export async function getPartnerBookingById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      property:properties(id, name, type, location, island),
      variant:listing_variants(name, price_per_unit, price_unit)
    `)
    .eq('id', id)
    .single()
  return data
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getPartnerCustomers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select('guest_name, guest_email, guest_phone, check_in, status')
    .neq('status', 'cancelled')
    .order('check_in', { ascending: false })

  if (!data) return []

  // Deduplicate by email, keeping latest booking date per guest
  const map = new Map<string, {
    name:         string
    email:        string
    phone:        string | null
    bookingCount: number
    lastBooking:  string
  }>()

  for (const b of data) {
    const existing = map.get(b.guest_email)
    if (!existing) {
      map.set(b.guest_email, {
        name: b.guest_name, email: b.guest_email, phone: b.guest_phone,
        bookingCount: 1, lastBooking: b.check_in,
      })
    } else {
      existing.bookingCount++
      if (b.check_in > existing.lastBooking) existing.lastBooking = b.check_in
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Create booking ───────────────────────────────────────────────────────────

export async function createPartnerBooking(input: {
  property_id:  string
  variant_id:   string | null
  guest_name:   string
  guest_email:  string
  guest_phone:  string | null
  guests_count: number
  check_in:     string
  check_out:    string | null
  base_amount:  number
  notes:        string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get the property's owner_id (the main business) and verify assignment
  const { data: property } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', input.property_id)
    .eq('partner_id', user.id)
    .single()

  if (!property) return { error: 'Property not found or not assigned to you' }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...input,
      owner_id:       property.owner_id,
      status:         'confirmed',
      payment_method: 'cash',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/portal')
  revalidatePath('/portal/bookings')
  return { success: true, id: data.id }
}

// ─── Admin: list all partners ─────────────────────────────────────────────────

export async function getPartnerProfiles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('role', 'partner')
    .order('full_name')
  return data ?? []
}

// ─── Admin: assign partner to property ───────────────────────────────────────

export async function assignPartnerToProperty(propertyId: string, partnerId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('properties')
    .update({ partner_id: partnerId })
    .eq('id', propertyId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/properties')
  revalidatePath(`/dashboard/admin/partners`)
  return { success: true }
}
