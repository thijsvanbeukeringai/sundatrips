import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FinancialsDashboard from '@/components/dashboard/FinancialsDashboard'

export interface BillPaymentRow {
  id:           string
  booking_id:   string
  total_amount: number
  paid_at:      string
  items:        Array<{
    name:        string
    category:    string
    quantity:    number
    unit_price:  number
    total_price: number
  }>
}

export interface BookingRow {
  id:           string
  guest_name:   string
  check_in:     string
  base_amount:  number
  platform_fee: number
  net_payout:   number
  status:       string
  property:     { name: string; type: string } | null
}

export interface OpenPOSItem {
  name:        string
  category:    string
  quantity:    number
  unit_price:  number
  total_price: number
}

function getDateRange(
  period: string,
  year: number,
  month: number,
  quarter: number,
): { start: string; end: string } {
  if (period === 'month') {
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 1)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  if (period === 'quarter') {
    const startMonth = (quarter - 1) * 3
    const start = new Date(year, startMonth, 1)
    const end   = new Date(year, startMonth + 3, 1)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  // year
  return { start: `${year}-01-01`, end: `${year + 1}-01-01` }
}

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; month?: string; quarter?: string; year?: string }>
}) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const sp      = await searchParams
  const period  = sp.period  ?? 'month'
  const year    = parseInt(sp.year    ?? String(new Date().getFullYear()))
  const month   = parseInt(sp.month   ?? String(new Date().getMonth() + 1))
  const quarter = parseInt(sp.quarter ?? String(Math.floor(new Date().getMonth() / 3) + 1))

  const { start, end } = getDateRange(period, year, month, quarter)

  const supabase = await createClient()

  const [{ data: bookings }, { data: billPayments }, { data: openPosItems }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, guest_name, check_in, base_amount, platform_fee, net_payout, status, property:properties(name, type)')
      .eq('owner_id', user.id)
      .neq('status', 'cancelled')
      .gte('check_in', start)
      .lt('check_in', end)
      .order('check_in', { ascending: false })
      .returns<BookingRow[]>(),

    supabase
      .from('bill_payments')
      .select('id, booking_id, total_amount, paid_at, items')
      .eq('owner_id', user.id)
      .gte('paid_at', start)
      .lt('paid_at', end)
      .order('paid_at', { ascending: false }),

    // Still-open POS items created in this period (not yet marked as paid)
    supabase
      .from('pos_items')
      .select('name, category, quantity, unit_price, total_price')
      .eq('owner_id', user.id)
      .gte('created_at', start)
      .lt('created_at', end),
  ])

  return (
    <FinancialsDashboard
      bookings={bookings ?? []}
      billPayments={(billPayments ?? []) as BillPaymentRow[]}
      openPosItems={(openPosItems ?? []) as OpenPOSItem[]}
      period={period}
      year={year}
      month={month}
      quarter={quarter}
    />
  )
}
