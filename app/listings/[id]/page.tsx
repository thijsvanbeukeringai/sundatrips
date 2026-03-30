import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Property, AvailabilityBlock, TimeSlot, ListingVariant, SlotAvailability } from '@/lib/types'
import ListingDetailClient from '@/components/ListingDetailClient'

export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!property) notFound()

  const p = property as Property

  const today   = new Date()
  const endDate = new Date(today)
  endDate.setMonth(endDate.getMonth() + 3)
  const from = today.toISOString().split('T')[0]
  const to   = endDate.toISOString().split('T')[0]

  const [{ data: blocks }, { data: slots }, { data: variantRows }, { data: slotAvailRows }] = await Promise.all([
    supabase.from('availability').select('*').eq('property_id', p.id).gte('date', from).lte('date', to),
    supabase.from('time_slots').select('*').eq('property_id', p.id).eq('is_active', true).order('sort_order'),
    supabase.from('listing_variants').select('*').eq('property_id', p.id).eq('is_active', true).order('sort_order'),
    supabase.from('slot_availability').select('*').eq('property_id', p.id).gte('date', from).lte('date', to),
  ])

  return (
    <ListingDetailClient
      property={p}
      availabilityBlocks={(blocks        ?? []) as AvailabilityBlock[]}
      timeSlots=        {(slots          ?? []) as TimeSlot[]}
      variants=         {(variantRows    ?? []) as ListingVariant[]}
      slotAvailability= {(slotAvailRows  ?? []) as SlotAvailability[]}
    />
  )
}
