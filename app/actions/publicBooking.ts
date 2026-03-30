'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface PublicBookingInput {
  property_id:  string
  owner_id:     string
  guest_name:   string
  guest_email:  string
  guest_phone:  string
  guests_count: number
  check_in:     string
  check_out:    string | null
  base_amount:  number
  notes:        string
  variant_id?:  string | null
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
  const { error } = await supabase.from('bookings').insert({
    property_id:    input.property_id,
    owner_id:       input.owner_id,
    guest_name:     input.guest_name.trim(),
    guest_email:    email,
    guest_phone:    input.guest_phone || null,
    guests_count:   input.guests_count,
    check_in:       input.check_in,
    check_out:      input.check_out || null,
    base_amount:    input.base_amount,
    status:         'pending',
    payment_method: 'cash',
    notes:          input.notes || null,
    guest_user_id:  guestUserId,
    variant_id:     input.variant_id || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/listings/${input.property_id}`)

  return { success: true }
}
