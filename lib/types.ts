// Auto-generated from the Supabase schema.
// Re-run `supabase gen types typescript` after schema changes.

export type Role = 'owner' | 'admin'
export type AllowedPaymentMethods = 'all' | 'cash_only' | 'online_only'
export type PropertyType = 'stay' | 'trip' | 'activity' | 'transfer'
export type Island = 'Lombok' | 'Bali' | 'Gili Islands'
export type PriceUnit = 'night' | 'person' | 'session' | 'day' | 'trip' | 'vehicle'
export type BookingStatus    = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
export type PaymentMethod    = 'cash' | 'stripe'
export type POSCategory = 'food' | 'drinks' | 'tours' | 'transport' | 'wellness' | 'other'
export type PayoutStatus = 'pending' | 'processing' | 'paid'

export interface Venue {
  id:            string
  owner_id:      string
  name:          string
  description:   string | null
  location:      string
  island:        Island
  images:        string[]
  amenities:     string[]
  allowed_types: PropertyType[]
  is_active:     boolean
  created_at:    string
  updated_at:    string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  avatar_url: string | null
  phone: string | null
  stripe_account_id: string | null
  stripe_onboarding_done: boolean
  stripe_charges_enabled: boolean
  allowed_payment_methods: AllowedPaymentMethods
  allowed_listing_types:   PropertyType[]
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  owner_id: string
  name: string
  description: string | null
  type: PropertyType
  location: string
  island: Island
  price_per_unit: number
  price_unit: PriceUnit
  max_capacity: number | null
  duration: string | null
  duration_hours: number | null  // numeric hours for time slot end-time display
  tag: string | null
  images: string[]
  amenities: string[]
  is_active: boolean
  venue_id: string | null
  // transfer-specific
  transfer_from:    string | null
  transfer_to:      string | null
  distance_km:      number | null
  english_speaking: boolean
  driver_name:      string | null
  driver_phone:     string | null
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  id:           string
  property_id:  string
  owner_id:     string
  start_time:   string     // 'HH:MM'
  days_of_week: number[]   // 1=Mon … 7=Sun (ISO weekday)
  is_active:    boolean
  sort_order:   number
  created_at:   string
}

export interface Booking {
  id: string
  property_id: string
  owner_id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  guest_nationality: string | null
  check_in: string
  check_out: string | null
  guests_count: number
  base_amount: number
  extras_amount: number
  total_amount: number        // generated
  platform_fee: number        // generated (1%)
  net_payout: number          // generated (99%)
  status: BookingStatus
  payment_method: PaymentMethod
  stripe_payment_intent_id: string | null
  stripe_payment_status: string | null
  notes: string | null
  guest_user_id: string | null
  variant_id:    string | null
  created_at: string
  updated_at: string
  // Joined
  property?: Property
  variant?:  ListingVariant
}

export interface POSCatalogItem {
  id: string
  owner_id: string
  name: string
  category: POSCategory
  default_price: number
  emoji: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface POSItem {
  id: string
  booking_id: string
  owner_id: string
  catalog_id: string | null
  name: string
  category: POSCategory
  unit_price: number
  quantity: number
  total_price: number         // generated
  notes: string | null
  created_at: string
}

export interface Payout {
  id: string
  owner_id: string
  period_start: string
  period_end: string
  gross_amount: number
  platform_fee: number
  net_amount: number
  status: PayoutStatus
  stripe_transfer_id: string | null
  paid_at: string | null
  created_at: string
}

export interface Invite {
  id: string
  email: string
  invited_by: string | null
  property_name: string | null
  token: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export interface AvailabilityBlock {
  id:              string
  property_id:     string
  owner_id:        string
  date:            string        // ISO date string YYYY-MM-DD
  available_spots: number | null // null = use property max_capacity; 0 = blocked
  is_blocked:      boolean
  note:            string | null
  created_at:      string
}

export interface SlotAvailability {
  id:              string
  property_id:     string
  owner_id:        string
  time_slot_id:    string
  date:            string   // YYYY-MM-DD
  available_spots: number
  created_at:      string
}

export interface ListingVariant {
  id:             string
  property_id:    string
  owner_id:       string
  name:           string
  description:    string | null
  price_per_unit: number
  price_unit:     string
  max_capacity:   number | null
  from_location:  string | null  // for transfers: pick-up point
  to_location:    string | null  // for transfers: drop-off point
  vehicle_type:   string | null  // for transfers: e.g. Sedan, Van, Minibus
  driver_name:    string | null  // for transfers: chauffeur name
  driver_phone:   string | null  // for transfers: chauffeur contact number
  amenities:      string[]
  is_active:      boolean
  sort_order:     number
  created_at:     string
}

// ── Dashboard aggregates ──────────────────────────────────────

export interface DashboardStats {
  bookings_today: number
  revenue_today: number
  revenue_month: number
  active_bookings: number
  pending_payout: number
}
