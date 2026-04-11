'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Euro, ShoppingBag,
  Building2, ChevronLeft, ChevronRight, Receipt,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'
import type { BookingRow, BillPaymentRow, OpenPOSItem } from '@/app/(dashboard)/dashboard/financials/page'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const CATEGORY_COLORS: Record<string, string> = {
  food:      'bg-amber-100 text-amber-700',
  drinks:    'bg-blue-100 text-blue-700',
  tours:     'bg-jungle-100 text-jungle-700',
  transport: 'bg-purple-100 text-purple-700',
  wellness:  'bg-pink-100 text-pink-700',
  other:     'bg-gray-100 text-gray-500',
}

function StatCard({
  label, value, sub, icon, accent = false,
}: {
  label:   string
  value:   string
  sub?:    string
  icon:    React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'bg-jungle-800 border-jungle-700' : 'bg-white border-gray-100'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? 'bg-white/10' : 'bg-gray-50'}`}>
        <span className={accent ? 'text-white' : 'text-jungle-700'}>{icon}</span>
      </div>
      <p className={`font-display text-2xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-xs font-semibold mt-0.5 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-white/50' : 'text-gray-300'}`}>{sub}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FinancialsDashboard({
  bookings, billPayments, openPosItems, period, year, month, quarter,
}: {
  bookings:     BookingRow[]
  billPayments: BillPaymentRow[]
  openPosItems: OpenPOSItem[]
  period:       string
  year:         number
  month:        number
  quarter:      number
}) {
  const { lang } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Period navigation ──────────────────────────────────────────────────────

  const navigate = useCallback((params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => p.set(k, v))
    router.push(`/dashboard/financials?${p.toString()}`)
  }, [router, searchParams])

  function setPeriod(p: string) {
    navigate({ period: p, year: String(year), month: String(month), quarter: String(quarter) })
  }

  function prevPeriod() {
    if (period === 'month') {
      month === 1
        ? navigate({ period, year: String(year - 1), month: '12', quarter: String(quarter) })
        : navigate({ period, year: String(year), month: String(month - 1), quarter: String(quarter) })
    } else if (period === 'quarter') {
      quarter === 1
        ? navigate({ period, year: String(year - 1), month: String(month), quarter: '4' })
        : navigate({ period, year: String(year), month: String(month), quarter: String(quarter - 1) })
    } else {
      navigate({ period, year: String(year - 1), month: String(month), quarter: String(quarter) })
    }
  }

  function nextPeriod() {
    if (period === 'month') {
      month === 12
        ? navigate({ period, year: String(year + 1), month: '1', quarter: String(quarter) })
        : navigate({ period, year: String(year), month: String(month + 1), quarter: String(quarter) })
    } else if (period === 'quarter') {
      quarter === 4
        ? navigate({ period, year: String(year + 1), month: String(month), quarter: '1' })
        : navigate({ period, year: String(year), month: String(month), quarter: String(quarter + 1) })
    } else {
      navigate({ period, year: String(year + 1), month: String(month), quarter: String(quarter) })
    }
  }

  function periodLabel() {
    if (period === 'month')   return `${MONTH_NAMES[month - 1]} ${year}`
    if (period === 'quarter') return `Q${quarter} ${year}`
    return String(year)
  }

  // ── Aggregates ─────────────────────────────────────────────────────────────

  const roomRevenue   = bookings.reduce((s, b) => s + b.base_amount, 0)
  const platformFees  = bookings.reduce((s, b) => s + b.platform_fee, 0)
  const roomNetPayout = bookings.reduce((s, b) => s + b.net_payout, 0)

  // Paid extras from bill_payments (exclude room-rate lines)
  const paidExtrasItems = billPayments.flatMap(p => p.items).filter(i => i.category !== 'room')
  const paidExtrasRevenue = paidExtrasItems.reduce((s, i) => s + i.total_price, 0)

  // Open (unpaid) items still in pos_items
  const openRevenue = openPosItems.reduce((s, i) => s + i.total_price, 0)

  const totalPosRevenue = paidExtrasRevenue + openRevenue
  const grossRevenue    = roomRevenue + totalPosRevenue
  const netPayout       = roomNetPayout + totalPosRevenue // POS has no fee

  // ── Monthly breakdown ──────────────────────────────────────────────────────

  const monthlyData = (() => {
    if (period === 'month') return []
    const months = period === 'quarter'
      ? [(quarter - 1) * 3, (quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2]
      : [0,1,2,3,4,5,6,7,8,9,10,11]

    return months.map(m => {
      const start = new Date(year, m, 1).toISOString().split('T')[0]
      const end   = new Date(year, m + 1, 1).toISOString().split('T')[0]
      const mRoom = bookings
        .filter(b => b.check_in >= start && b.check_in < end)
        .reduce((s, b) => s + b.base_amount, 0)
      const mPos = billPayments
        .filter(p => p.paid_at >= start && p.paid_at < end)
        .flatMap(p => p.items)
        .filter(i => i.category !== 'room')
        .reduce((s, i) => s + i.total_price, 0)
      return { month: MONTH_NAMES[m].slice(0, 3), room: mRoom, pos: mPos, total: mRoom + mPos }
    })
  })()

  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1)

  // ── Product breakdown: merge paid + open items ─────────────────────────────
  // Key by lowercase name so duplicates from different bills collapse together

  const productMap = new Map<string, { name: string; category: string; qty: number; revenue: number; open: number }>()

  function addToMap(item: { name: string; category: string; quantity: number; total_price: number }, isPaid: boolean) {
    const key = item.name.toLowerCase().trim()
    const row = productMap.get(key)
    if (row) {
      row.qty     += item.quantity
      row.revenue += isPaid ? item.total_price : 0
      row.open    += isPaid ? 0 : item.total_price
    } else {
      productMap.set(key, {
        name:     item.name,
        category: item.category,
        qty:      item.quantity,
        revenue:  isPaid ? item.total_price : 0,
        open:     isPaid ? 0 : item.total_price,
      })
    }
  }

  for (const item of paidExtrasItems)  addToMap(item, true)
  for (const item of openPosItems)     addToMap(item, false)

  const products = Array.from(productMap.values())
    .sort((a, b) => (b.revenue + b.open) - (a.revenue + a.open))

  const totalQty  = products.reduce((s, p) => s + p.qty, 0)

  // Average extras spend per booking (only bookings that had any POS activity)
  const bookingsWithExtras = new Set([
    ...billPayments.map(p => p.booking_id),
    // can't link openPosItems to bookings without joining, so just use billPayments count
  ]).size
  const avgExtrasPerBooking = bookingsWithExtras > 0
    ? paidExtrasRevenue / bookingsWithExtras
    : 0

  return (
    <div className="p-4 sm:p-8 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-jungle-800">Financials</h1>
          <p className="text-gray-400 text-sm mt-1">Revenue overview for {periodLabel()}</p>
        </div>
      </div>

      {/* ── Period filter ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['month','quarter','year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                period === p ? 'bg-white text-jungle-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'month' ? 'Month' : p === 'quarter' ? 'Quarter' : 'Year'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
          <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-semibold text-gray-700 min-w-[130px] text-center">{periodLabel()}</span>
          <button onClick={nextPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <div className="col-span-2 lg:col-span-1 xl:col-span-2">
          <StatCard label="Net payout" value={formatPriceRaw(netPayout, lang)} sub={`${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`} icon={<TrendingUp className="w-4 h-4" />} accent />
        </div>
        <StatCard label="Gross revenue"       value={formatPriceRaw(grossRevenue, lang)}      icon={<Euro className="w-4 h-4" />} />
        <StatCard label="Room revenue"        value={formatPriceRaw(roomRevenue, lang)}        icon={<Building2 className="w-4 h-4" />} />
        <StatCard label="Extras / POS"        value={formatPriceRaw(totalPosRevenue, lang)}    sub={`${totalQty} items sold`}                               icon={<ShoppingBag className="w-4 h-4" />} />
        <StatCard label="Avg. extras / stay"  value={formatPriceRaw(avgExtrasPerBooking, lang)} sub={`over ${bookingsWithExtras} paid bill${bookingsWithExtras !== 1 ? 's' : ''}`} icon={<Receipt className="w-4 h-4" />} />
      </div>

      {/* ── Monthly bar chart ── */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-5">
            {period === 'quarter' ? `Q${quarter} ${year} — by month` : `${year} — by month`}
          </h2>
          <div className="flex items-end gap-2 sm:gap-3 h-40">
            {monthlyData.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col gap-0 justify-end rounded-t overflow-hidden" style={{ height: `${(m.total / maxMonthly) * 100}%`, minHeight: m.total > 0 ? '6px' : '0' }}>
                  {m.pos > 0 && <div className="w-full bg-amber-400 flex-shrink-0" style={{ height: `${(m.pos / m.total) * 100}%` }} />}
                  {m.room > 0 && <div className="w-full bg-jungle-600 flex-1" />}
                </div>
                <p className="text-[11px] font-semibold text-gray-400">{m.month}</p>
                {m.total > 0 && <p className="text-[10px] text-gray-400 hidden sm:block">{formatPriceRaw(m.total, lang)}</p>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-jungle-600 flex-shrink-0" /> Room</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-amber-400 flex-shrink-0" /> Extras / POS</span>
          </div>
        </div>
      )}

      {/* ── POS product sales table — full width ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
            POS sales — per product
          </h2>
          <span className="ml-auto text-xs text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''}</span>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No POS items in this period</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-50">
              {products.map(p => (
                <div key={p.name} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-500'}`}>
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ×{p.qty} sold
                      {p.open > 0 && <span className="text-amber-500 ml-1.5">+{formatPriceRaw(p.open, lang)} open</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatPriceRaw(p.revenue + p.open, lang)}</p>
                    <p className="text-[11px] text-jungle-700 font-semibold">{formatPriceRaw(p.revenue, lang)} paid</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total</p>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatPriceRaw(totalPosRevenue, lang)}</p>
                  <p className="text-[11px] text-gray-400">×{totalQty} items</p>
                </div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-3 font-semibold">Product</th>
                    <th className="text-left px-6 py-3 font-semibold">Category</th>
                    <th className="text-right px-6 py-3 font-semibold">Qty sold</th>
                    <th className="text-right px-6 py-3 font-semibold">Avg. price</th>
                    <th className="text-right px-6 py-3 font-semibold">Open (unpaid)</th>
                    <th className="text-right px-6 py-3 font-semibold">Paid</th>
                    <th className="text-right px-6 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.name} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-semibold text-gray-800">{p.name}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-500'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-gray-700">
                        {p.qty}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-400 text-xs">
                        {formatPriceRaw(p.qty > 0 ? (p.revenue + p.open) / p.qty : 0, lang)}
                      </td>
                      <td className="px-6 py-3 text-right text-amber-600 font-medium">
                        {p.open > 0 ? formatPriceRaw(p.open, lang) : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-jungle-700">
                        {formatPriceRaw(p.revenue, lang)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">
                        {formatPriceRaw(p.revenue + p.open, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-100 bg-gray-50/50">
                    <td colSpan={2} className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-700">{totalQty}</td>
                    <td />
                    <td className="px-6 py-3 text-right font-bold text-amber-600">
                      {openRevenue > 0 ? formatPriceRaw(openRevenue, lang) : <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-jungle-700">{formatPriceRaw(paidExtrasRevenue, lang)}</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">{formatPriceRaw(totalPosRevenue, lang)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
