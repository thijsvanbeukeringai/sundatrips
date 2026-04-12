'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { autoAssignRoom } from './rooms'

interface PublicBookingInput {
  property_id:  string
  owner_id:     string
  guest_name:   string
  guest_email:  string
  guest_phone:  string
  guests_count: number
  check_in:     string
  check_out:    string | null
  pickup_time?: string | null
  base_amount:  number
  notes:        string
  variant_id?:  string | null
  room_id?:     string | null
}

export async function createPublicBooking(input: PublicBookingInput): Promise<{ error?: string; success?: true }> {
  const supabase  = createAdminClient()
  const email     = input.guest_email.trim().toLowerCase()

  // Resolve origin for redirect URL
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Find or invite the guest user
  let guestUserId: string | null = null
  try {
    const { data: invite } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/my-bookings`,
      data: { full_name: input.guest_name.trim() },
    })
    guestUserId = invite?.user?.id ?? null
  } catch {
    // User already exists — look them up
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existing = list?.users?.find(u => u.email === email)
    guestUserId = existing?.id ?? null
  }

  // Create the booking
  const { data: booking, error } = await supabase.from('bookings').insert({
    property_id:    input.property_id,
    owner_id:       input.owner_id,
    guest_name:     input.guest_name.trim(),
    guest_email:    email,
    guest_phone:    input.guest_phone || null,
    guests_count:   input.guests_count,
    check_in:       input.check_in,
    check_out:      input.check_out || null,
    pickup_time:    input.pickup_time || null,
    base_amount:    input.base_amount,
    status:         'pending',
    payment_method: 'cash',
    notes:          input.notes || null,
    guest_user_id:  guestUserId,
    variant_id:     input.variant_id || null,
    room_id:        input.room_id || null,
  }).select('id').single()

  if (error) return { error: error.message }

  // Fetch booking number (may not exist if migration hasn't run yet)
  let bookingNumber = ''
  try {
    const { data: bk } = await supabase
      .from('bookings')
      .select('booking_number')
      .eq('id', booking.id)
      .single()
    bookingNumber = String(bk?.booking_number ?? '')
  } catch { /* column may not exist yet */ }

  // If no room was manually chosen, auto-assign
  if (booking && !input.room_id) {
    await autoAssignRoom(
      booking.id,
      input.property_id,
      input.variant_id ?? null,
      input.check_in,
      input.check_out,
    )
  }

  // Fetch property details for the email
  const { data: property } = await supabase
    .from('properties')
    .select('name, type, location, island, transfer_from, transfer_to')
    .eq('id', input.property_id)
    .single()

  // Send "trip pending" notification email to the guest
  try {
    const { sendMailWithTemplate } = await import('@/lib/mailgun')

    const dateFormatted = new Date(input.check_in).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    await sendMailWithTemplate({
      to: email,
      subject: bookingNumber
        ? `Booking request #${bookingNumber} received — ${property?.name ?? 'Sunda Trips'}`
        : `Booking request received — ${property?.name ?? 'Sunda Trips'}`,
      template: 'trip-pending',
      variables: {
        guestName:     input.guest_name.trim(),
        bookingNumber,
        serviceName:   property?.name ?? 'Service',
        serviceType:   property?.type ?? '',
        date:          dateFormatted,
        pickupTime:    input.pickup_time ?? '',
        location:      property?.location ?? '',
        island:        property?.island ?? '',
        guestsCount:   String(input.guests_count),
        amount:        `€${input.base_amount}`,
        transferFrom:  input.notes?.match(/Pickup: (.+)/)?.[1] || property?.transfer_from || '',
        transferTo:    property?.transfer_to ?? '',
        pickupAddress: input.notes?.match(/Pickup: (.+)/)?.[1] ?? '',
        notes:         input.notes ?? '',
      },
    })
  } catch (err: any) {
    console.error('[createPublicBooking] Mailgun error:', err)
    // Don't fail the booking if email fails
  }

  revalidatePath(`/listings/${input.property_id}`)

  return { success: true }
}
