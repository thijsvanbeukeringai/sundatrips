import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Property, Booking, AvailabilityBlock, TimeSlot, SlotAvailability } from '@/lib/types'
import AvailabilityCalendar from '@/components/dashboard/AvailabilityCalendar'
import TimeSlotManager from '@/components/dashboard/TimeSlotManager'

export default async function AvailabilityPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single<Property>()

  if (!property) notFound()

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 1)

  const [{ data: bookings }, { data: blocks }, { data: slots }, { data: slotAvail }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, check_in, check_out, guests_count, guest_name, status')
      .eq('property_id', property.id)
      .neq('status', 'cancelled')
      .gte('check_in', threeMonthsAgo.toISOString().split('T')[0])
      .order('check_in'),

    supabase
      .from('availability')
      .select('*')
      .eq('property_id', property.id)
      .order('date'),

    supabase
      .from('time_slots')
      .select('*')
      .eq('property_id', property.id)
      .order('sort_order'),
    supabase
      .from('slot_availability')
      .select('*')
      .eq('property_id', property.id),
  ])

  const hasTimeSlots = property.type === 'activity' || property.type === 'trip'

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/properties" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-jungle-800">{property.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {property.type === 'stay' ? 'Availability per night' : 'Availability & time slots'}
            {property.max_capacity ? ` · Max ${property.max_capacity}` : ''}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <AvailabilityCalendar
          property={property}
          bookings={(bookings ?? []) as any[]}
          blocks={(blocks ?? []) as AvailabilityBlock[]}
          slots={(slots ?? []) as TimeSlot[]}
          slotAvailability={(slotAvail ?? []) as SlotAvailability[]}
        />

        {hasTimeSlots && (
          <TimeSlotManager
            propertyId={property.id}
            slots={(slots ?? []) as TimeSlot[]}
            durationHours={property.duration_hours}
          />
        )}
      </div>
    </div>
  )
}
