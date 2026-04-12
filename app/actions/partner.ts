'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('bookings')
    .select(`
      *,
      property:properties(id, name, type, location, island),
      variant:listing_variants(name, price_per_unit, price_unit)
    `)
    .eq('owner_id', user.id)
    .order('check_in', { ascending: filter !== 'past' })

  if (filter === 'upcoming') query = query.gte('check_in', today).neq('status', 'cancelled')
  if (filter === 'past')     query = query.lt('check_in', today)

  const { data } = await query
  return data ?? []
}

export async function getPartnerBookingById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      property:properties(id, name, type, location, island),
      variant:listing_variants(name, price_per_unit, price_unit)
    `)
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()
  return data
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getPartnerCustomers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('bookings')
    .select('guest_name, guest_email, guest_phone, check_in, status')
    .eq('owner_id', user.id)
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
  pickup_time?: string | null
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

// ─── Admin: list all partners with onboarding status ──────────────────────────

export async function getPartnerProfiles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('role', 'partner')
    .order('full_name')
  return data ?? []
}

export async function getPartnerProfilesWithStatus() {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('role', 'partner')
    .order('full_name')

  if (!profiles?.length) return []

  const admin = createAdminClient()
  const withStatus = await Promise.all(
    profiles.map(async p => {
      const { data: { user } } = await admin.auth.admin.getUserById(p.id)
      return { ...p, onboarded: !!user?.user_metadata?.onboarded }
    })
  )
  return withStatus
}

export async function resendPartnerInvite(email: string, fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  // Generate a new invite link (without sending Supabase's built-in email)
  // Try invite first; if user already exists, fall back to magic link
  let data
  const { data: inviteData, error: inviteError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { full_name: fullName, role: 'partner' },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })

  if (inviteError) {
    // User already exists — use magic link instead
    const { data: magicData, error: magicError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
      },
    })
    if (magicError) return { error: magicError.message }
    data = magicData
  } else {
    data = inviteData
  }

  // Look up the company/service name from the invites table
  const { data: invite } = await supabase
    .from('invites')
    .select('property_name')
    .eq('email', email)
    .single()

  // Send the invite email via Mailgun template
  const { sendMailWithTemplate } = await import('@/lib/mailgun')

  const inviteLink = data.properties.action_link

  try {
    await sendMailWithTemplate({
      to: email,
      subject: "You're invited to join Sunda Trips as a partner",
      template: 'invitation',
      variables: {
        name: invite?.property_name || fullName,
        inviteLink,
      },
    })
  } catch (err: any) {
    console.error('[resendPartnerInvite] Mailgun error:', err)
    return { error: 'Failed to send email' }
  }

  return { success: true }
}

// ─── Partner services (own listings) ─────────────────────────────────────────

export async function getPartnerOwnedServices() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('properties')
    .select('*, variants:listing_variants(*)')
    .eq('owner_id', user.id)
    .order('name')

  return data ?? []
}

export async function getPartnerServiceById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  return data
}

function parseImages(raw: string): string[] {
  return raw.split('\n').map(s => s.trim()).filter(Boolean)
}
function parseAmenities(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export async function createPartnerService(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('properties').insert({
    owner_id:         user.id,
    partner_id:       user.id,
    name:             formData.get('name') as string,
    type:             formData.get('type') as string,
    island:           formData.get('island') as string,
    location:         formData.get('location') as string,
    description:      (formData.get('description') as string) || null,
    tag:              (formData.get('tag') as string) || null,
    price_per_unit:   parseFloat(formData.get('price_per_unit') as string),
    price_unit:       formData.get('price_unit') as string,
    max_capacity:     formData.get('max_capacity') ? parseInt(formData.get('max_capacity') as string) : null,
    duration:         (formData.get('duration') as string) || null,
    duration_hours:   formData.get('duration_hours') ? parseFloat(formData.get('duration_hours') as string) : null,
    images:           parseImages(formData.get('images') as string),
    amenities:        parseAmenities(formData.get('amenities') as string),
    is_active:        formData.get('is_active') === 'on',
    transfer_from:    (formData.get('transfer_from') as string) || null,
    transfer_to:      (formData.get('transfer_to') as string) || null,
    distance_km:      formData.get('distance_km') ? parseFloat(formData.get('distance_km') as string) : null,
    english_speaking:  formData.get('english_speaking') === 'on',
    driver_name:       (formData.get('driver_name') as string) || null,
    driver_phone:      (formData.get('driver_phone') as string) || null,
    price_per_km:      formData.get('price_per_km') ? parseFloat(formData.get('price_per_km') as string) : null,
    pickup_available:        formData.get('pickup_available') === 'on',
    private_tour_available:  formData.get('private_tour_available') === 'on',
    private_tour_price:      formData.get('private_tour_price') ? parseFloat(formData.get('private_tour_price') as string) : null,
    start_location:          (formData.get('start_location') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/portal/services')
  revalidatePath('/')
  redirect('/portal/services')
}

export async function updatePartnerService(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('properties')
    .update({
      name:             formData.get('name') as string,
      type:             formData.get('type') as string,
      island:           formData.get('island') as string,
      location:         formData.get('location') as string,
      description:      (formData.get('description') as string) || null,
      tag:              (formData.get('tag') as string) || null,
      price_per_unit:   parseFloat(formData.get('price_per_unit') as string),
      price_unit:       formData.get('price_unit') as string,
      max_capacity:     formData.get('max_capacity') ? parseInt(formData.get('max_capacity') as string) : null,
      duration:         (formData.get('duration') as string) || null,
      duration_hours:   formData.get('duration_hours') ? parseFloat(formData.get('duration_hours') as string) : null,
      images:           parseImages(formData.get('images') as string),
      amenities:        parseAmenities(formData.get('amenities') as string),
      is_active:        formData.get('is_active') === 'on',
      transfer_from:    (formData.get('transfer_from') as string) || null,
      transfer_to:      (formData.get('transfer_to') as string) || null,
      distance_km:      formData.get('distance_km') ? parseFloat(formData.get('distance_km') as string) : null,
      english_speaking:  formData.get('english_speaking') === 'on',
      driver_name:       (formData.get('driver_name') as string) || null,
      driver_phone:      (formData.get('driver_phone') as string) || null,
      price_per_km:      formData.get('price_per_km') ? parseFloat(formData.get('price_per_km') as string) : null,
      pickup_available:        formData.get('pickup_available') === 'on',
      private_tour_available:  formData.get('private_tour_available') === 'on',
      private_tour_price:      formData.get('private_tour_price') ? parseFloat(formData.get('private_tour_price') as string) : null,
      start_location:          (formData.get('start_location') as string) || null,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/portal/services')
  revalidatePath('/')
  redirect('/portal/services')
}

export async function togglePartnerServiceActive(id: string, is_active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('properties')
    .update({ is_active })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/portal/services')
  revalidatePath('/')
  return { success: true }
}

export async function deletePartnerService(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/portal/services')
  revalidatePath('/')
  return { success: true }
}

// ─── Partner: accept/confirm a pending booking ──────────────────────────────

export async function acceptPartnerBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch booking with property details
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select(`
      *,
      property:properties(name, type, location, island, transfer_from, transfer_to, driver_name, driver_phone, duration, max_capacity, pickup_available, private_tour_available, private_tour_price),
      variant:listing_variants(driver_name, driver_phone)
    `)
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) return { error: 'Booking not found' }
  if (booking.status !== 'pending') return { error: 'Booking is not pending' }

  // Fetch partner profile for contact details in confirmation email
  const { data: partnerProfile } = await supabase
    .from('profiles')
    .select('full_name, phone, company_name')
    .eq('id', user.id)
    .single()

  // Update status to confirmed
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)

  if (updateErr) return { error: updateErr.message }

  // Update slot availability when booking is confirmed
  const isPrivateTour = booking.notes?.includes('Private tour') ?? false
  const timeSlotMatch = booking.notes?.match(/Time slot: (\d{2}:\d{2})/)
  const startTime = timeSlotMatch?.[1]

  if (startTime) {
    const { data: slot } = await supabase
      .from('time_slots')
      .select('id')
      .eq('property_id', booking.property_id)
      .eq('start_time', startTime)
      .single()

    if (slot) {
      if (isPrivateTour) {
        // Private tour: block entire slot
        await supabase
          .from('slot_availability')
          .upsert({
            property_id:     booking.property_id,
            owner_id:        user.id,
            time_slot_id:    slot.id,
            date:            booking.check_in,
            available_spots: 0,
          }, { onConflict: 'time_slot_id,date' })
      } else {
        // Regular booking: reduce available spots by guests_count
        const property = (booking as any).property
        const maxCapacity = property?.max_capacity ?? 99

        // Get current available spots
        const { data: existing } = await supabase
          .from('slot_availability')
          .select('available_spots')
          .eq('time_slot_id', slot.id)
          .eq('date', booking.check_in)
          .single()

        const currentSpots = existing?.available_spots ?? maxCapacity
        const newSpots = Math.max(0, currentSpots - booking.guests_count)

        await supabase
          .from('slot_availability')
          .upsert({
            property_id:     booking.property_id,
            owner_id:        user.id,
            time_slot_id:    slot.id,
            date:            booking.check_in,
            available_spots: newSpots,
          }, { onConflict: 'time_slot_id,date' })
      }
    }
  }

  // Send confirmation email via Mailgun
  try {
    const { sendMailWithTemplate } = await import('@/lib/mailgun')
    const property = (booking as any).property
    const variant  = (booking as any).variant

    const isActivityType = property?.type === 'activity' || property?.type === 'trip'

    // Driver info: prefer variant driver, fallback to property driver
    const driverName  = variant?.driver_name  || property?.driver_name  || ''
    const driverPhone = variant?.driver_phone || property?.driver_phone || ''

    // Parse notes
    const pickupAddress = booking.notes?.match(/Pickup: (.+)/)?.[1] ?? ''
    const timeSlot      = booking.notes?.match(/Time slot: (.+)/)?.[1] ?? ''
    const isPrivateTour = booking.notes?.includes('Private tour') ?? false
    const transferFrom  = pickupAddress || property?.transfer_from || ''

    const dateFormatted = new Date(booking.check_in).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const templateName = isActivityType ? 'activity confirmed' : 'trip confirmation'

    const variables: Record<string, string> = {
      guestName:     booking.guest_name,
      bookingNumber: String(booking.booking_number ?? ''),
      serviceName:   property?.name ?? 'Service',
      serviceType:   property?.type ?? '',
      date:          dateFormatted,
      location:      property?.location ?? '',
      island:        property?.island ?? '',
      guestsCount:   String(booking.guests_count),
      amount:        `Rp ${Math.round(booking.base_amount).toLocaleString('id-ID')}`,
      notes:         booking.notes ?? '',
    }

    if (isActivityType) {
      Object.assign(variables, {
        timeSlot,
        duration:         property?.duration ?? '',
        privateTour:      isPrivateTour ? 'yes' : 'no',
        privateTourPrice: isPrivateTour && property?.private_tour_price
          ? `Rp ${Math.round(property.private_tour_price).toLocaleString('id-ID')}`
          : '',
        maxCapacity:      String(property?.max_capacity ?? ''),
        pickupAddress,
        partnerName:      partnerProfile?.company_name || partnerProfile?.full_name || '',
        partnerPhone:     partnerProfile?.phone || '',
      })
    } else {
      Object.assign(variables, {
        pickupTime:    booking.pickup_time ?? '',
        pickupAddress,
        transferFrom,
        transferTo:    property?.transfer_to ?? '',
        driverName,
        driverPhone,
      })
    }

    await sendMailWithTemplate({
      to: booking.guest_email,
      subject: `Booking #${booking.booking_number} confirmed — ${property?.name ?? 'Sunda Trips'}`,
      template: templateName,
      variables,
    })
  } catch (err: any) {
    console.error('[acceptPartnerBooking] Mailgun error:', err)
    // Don't fail the booking accept if email fails
  }

  revalidatePath('/portal/bookings')
  revalidatePath(`/portal/bookings/${bookingId}`)
  revalidatePath('/portal')
  return { success: true }
}

// ─── Partner: decline/cancel a pending booking ──────────────────────────────

export async function declinePartnerBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, property:properties(name)')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) return { error: 'Booking not found' }
  if (booking.status !== 'pending') return { error: 'Booking is not pending' }

  const { error: updateErr } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', base_amount: 0 })
    .eq('id', bookingId)

  if (updateErr) return { error: updateErr.message }

  // Notify guest via email
  try {
    const { sendMailWithTemplate } = await import('@/lib/mailgun')
    const property = (booking as any).property

    await sendMailWithTemplate({
      to: booking.guest_email,
      subject: `Booking #${booking.booking_number ?? ''} — driver not available`,
      template: 'afgewezen',
      variables: {
        guestName:     booking.guest_name,
        bookingNumber: String(booking.booking_number ?? ''),
        serviceName:   property?.name ?? 'Service',
        date:          new Date(booking.check_in).toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        }),
      },
    })
  } catch (err: any) {
    console.error('[declinePartnerBooking] Mailgun error:', err)
  }

  revalidatePath('/portal/bookings')
  revalidatePath(`/portal/bookings/${bookingId}`)
  revalidatePath('/portal')
  return { success: true }
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
