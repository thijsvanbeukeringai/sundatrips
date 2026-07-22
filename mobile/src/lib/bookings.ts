import { supabase } from './supabase'

export interface CreateBookingInput {
  property_id: string
  guest_name: string
  guest_email: string
  guest_phone?: string | null
  guests_count: number
  check_in: string
  check_out?: string | null
  variant_id?: string | null
  time_slot_id?: string | null
  slot_label?: string | null
  base_amount: number
  notes?: string
}

export interface CreateBookingResult {
  success: boolean
  booking_number?: string
  error?: string
}

export interface AvailabilityVariant {
  id: string
  name: string
  price_per_unit: number
  price_unit: string
  max_capacity: number | null
  rooms_available: number
}

export interface AvailabilitySlot {
  id: string
  start_time: string
  spots_left: number
  max_capacity: number
  full: boolean
}

export type AvailabilityResult =
  | { kind: 'variants'; variants: AvailabilityVariant[] }
  | { kind: 'slots'; slots: AvailabilitySlot[] }
  | { kind: 'none' }
  | { kind: 'error'; error: string }

// Asks the availability edge function what is bookable for the given dates.
export async function checkAvailability(body: {
  property_id: string
  check_in?: string
  check_out?: string
  date?: string
}): Promise<AvailabilityResult> {
  const { data, error } = await supabase.functions.invoke('availability', { body })
  if (error) return { kind: 'error', error: error.message }
  if (data?.error) return { kind: 'error', error: data.error }
  return data as AvailabilityResult
}

// Submits a booking *request* via the create-booking edge function.
// No payment is taken — the function creates a pending booking and emails
// the guest + partner.
export async function createBookingRequest(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const { data, error } = await supabase.functions.invoke('create-booking', {
    body: input,
  })

  if (error) {
    // Try to surface the function's own error message if present.
    let message = error.message
    try {
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json()
        if (body?.error) message = body.error
      }
    } catch {
      /* ignore — fall back to the generic message */
    }
    return { success: false, error: message }
  }

  if (data?.error) return { success: false, error: data.error }
  return { success: true, booking_number: data?.booking_number }
}
