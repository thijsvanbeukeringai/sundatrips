'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Euro, ShoppingBag,
  CalendarDays, Building2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRow {
  id:           string
  guest_name:   string
  check_in:     string
  base_amount:  number
  platform_fee: number
  net_payout:   number
  status:       string
  property:     { name: string; type: string } | null
}

interface BillItem {
  name:        string
  category:    string
  quantity:    number
  unit_price:  number
  total_price: number
}

interface BillPaymentRow {
  id:           string
  booking_id:   string
  total_amount: number
  paid_at:      string
  items:        BillItem[]
}

interface Props {
  bookings:     BookingRow[]
  billPayments: BillPaymentRow[]
  period:       string
  year:         number
  month:        number
  quarter:      number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  checked_in: 'bg-jungle-100 text-jungle-800',
  completed:  'bg-gray-100 text-gray-600',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({
  label, value, sub, icon, accent = false,
}: {
  label:    string
  value:    string
  sub?:     string
  icon:     React.ReactNode
  accent?:  boolean
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'bg-jungle-800 border-jungle-700' : 'bg-white border-gray-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-white/10' : 'bg-gray-50'}`}>
          <span className={accent ? 'text-white' : 'text-jungle-700'}>{icon}</span>
        </div>
      </div>
      <p className={`font-display text-2xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-xs font-semibold mt-0.5 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-white/50' : 'text-gray-300'}`}>{sub}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FinancialsDashboard({
  bookings, billPayments, period, year, month, quarter,
}: Props) {
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
      if (month === 1) navigate({ period, year: String(year - 1), month: '12', quarter: String(quarter) })
      else navigate({ period, year: String(year), month: String(month - 1), quarter: String(quarter) })
    } else if (period === 'quarter') {
      if (quarter === 1) navigate({ period, year: String(year - 1), month: String(month), quarter: '4' })
      else navigate({ period, year: String(year), month: String(month), quarter: String(quarter - 1) })
    } else {
      navigate({ period, year: String(year - 1), month: String(month), quarter: String(quarter) })
    }
  }

  function nextPeriod() {
    if (period === 'month') {
      if (month === 12) navigate({ period, year: String(year + 1), month: '1', quarter: String(quarter) })
      else navigate({ period, year: String(year), month: String(month + 1), quarter: String(quarter) })
    } else if (period === 'quarter') {
      if (quarter === 4) navigate({ period, year: String(year + 1), month: String(month), quarter: '1' })
      else navigate({ period, year: String(year), month: String(month), quarter: String(quarter + 1) })
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

  // POS: all items from bill_payments, separating room items from extras
  const allBillItems = billPayments.flatMap(p => p.items)
  const posItems     = allBillItems.filter(i => i.category !== 'room')
  const posRevenue   = posItems.reduce((s, i) => s + i.total_price, 0)

  const grossRevenue = roomRevenue + posRevenue
  const netPayout    = roomNetPayout + posRevenue  // POS has no fee

  // ── Monthly breakdown (for quarter/year) ──────────────────────────────────

  const monthlyData = (() => {
    if (period === 'month') return []
    const months = period === 'quarter'
      ? [(quarter - 1) * 3, (quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2]
      : [0,1,2,3,4,5,6,7,8,9,10,11]

    return months.map(m => {
      const start = new Date(year, m, 1).toISOString().split('T')[0]
      const end   = new Date(year, m + 1, 1).toISOString().split('T')[0]
      const mBookings = bookings.filter(b => b.check_in >= start && b.check_in < end)
      const mPayments = billPayments.filter(p => p.paid_at >= start && p.paid_at < end)
      const mRoom = mBookings.reduce((s, b) => s + b.base_amount, 0)
      const mPos  = mPayments.flatMap(p => p.items).filter(i => i.category !== 'room').reduce((s, i) => s + i.total_price, 0)
      return { month: MONTH_NAMES[m].slice(0, 3), room: mRoom, pos: mPos, total: mRoom + mPos }
    })
  })()

  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1)

  // ── POS product breakdown ─────────────────────────────────────────────────

  const productMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>()
  for (const item of posItems) {
    const key = item.name.toLowerCase()
    const existing = productMap.get(key)
    if (existing) {
      existing.qty     += item.quantity
      existing.revenue += item.total_price
    } else {
      productMap.set(key, { name: item.name, category: item.category, qty: item.quantity, revenue: item.total_price })
    }
  }
  const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

  const CATEGORY_COLORS: Record<string, string> = {
    food:      'bg-amber-100 text-amber-700',
    drinks:    'bg-blue-100 text-blue-700',
    tours:     'bg-jungle-100 text-jungle-700',
    transport: 'bg-purple-100 text-purple-700',
    wellness:  'bg-pink-100 text-pink-700',
    other:     'bg-gray-100 text-gray-500',
  }

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
        {/* Type tabs */}
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

        {/* Navigator */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
          <button
            onClick={prevPeriod}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-semibold text-gray-700 min-w-[130px] text-center">
            {periodLabel()}
          </span>
          <button
            onClick={nextPeriod}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <div className="col-span-2 lg:col-span-1 xl:col-span-2">
          <StatCard
            label="Net payout"
            value={formatPriceRaw(netPayout, lang)}
            sub={`${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
            icon={<TrendingUp className="w-4 h-4" />}
            accent
          />
        </div>
        <StatCard
          label="Gross revenue"
          value={formatPriceRaw(grossRevenue, lang)}
          icon={<Euro className="w-4 h-4" />}
        />
        <StatCard
          label="Room revenue"
          value={formatPriceRaw(roomRevenue, lang)}
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          label="Extras / POS"
          value={formatPriceRaw(posRevenue, lang)}
          sub={`${posItems.length} item${posItems.length !== 1 ? 's' : ''} sold`}
          icon={<ShoppingBag className="w-4 h-4" />}
        />
        <StatCard
          label="Platform fee"
          value={`−${formatPriceRaw(platformFees, lang)}`}
          sub="1% on room only"
          icon={<TrendingDown className="w-4 h-4" />}
        />
      </div>

      {/* ── Monthly bar chart (quarter / year) ── */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-5">
            {period === 'quarter' ? `Q${quarter} ${year} — by month` : `${year} — by month`}
          </h2>
          <div className="flex items-end gap-2 sm:gap-3 h-40">
            {monthlyData.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: `${(m.total / maxMonthly) * 100}%`, minHeight: m.total > 0 ? '4px' : '0' }}>
                  {/* POS bar stacked on top */}
                  {m.pos > 0 && (
                    <div
                      className="w-full bg-amber-400 rounded-t"
                      style={{ height: `${(m.pos / m.total) * 100}%`, minHeight: '4px' }}
                    />
                  )}
                  {/* Room bar */}
                  {m.room > 0 && (
                    <div
                      className={`w-full bg-jungle-600 ${m.pos > 0 ? '' : 'rounded-t'} rounded-b`}
                      style={{ height: `${(m.room / m.total) * 100}%`, minHeight: '4px' }}
                    />
                  )}
                </div>
                <p className="text-[11px] font-semibold text-gray-400">{m.month}</p>
                {m.total > 0 && (
                  <p className="text-[10px] text-gray-400 hidden sm:block">{formatPriceRaw(m.total, lang)}</p>
                )}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-jungle-600" /> Room
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-amber-400" /> Extras / POS
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">

        {/* ── Bookings table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              Bookings ({bookings.length})
            </h2>
          </div>

          {bookings.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No bookings in this period</p>
            </div>
          ) : (
            <>
              {/* Mobile list */}
              <div className="md:hidden divide-y divide-gray-50">
                {bookings.map(b => (
                  <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{b.guest_name}</p>
                      <p className="text-xs text-gray-400 truncate">{b.property?.name ?? '—'} · {formatDate(b.check_in)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-jungle-700">{formatPriceRaw(b.net_payout, lang)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-5 py-3 font-semibold">Guest</th>
                      <th className="text-left px-5 py-3 font-semibold">Property</th>
                      <th className="text-left px-5 py-3 font-semibold">Check-in</th>
                      <th className="text-right px-5 py-3 font-semibold">Room</th>
                      <th className="text-right px-5 py-3 font-semibold">Fee</th>
                      <th className="text-right px-5 py-3 font-semibold">Payout</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{b.guest_name}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{b.property?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(b.check_in)}</td>
                        <td className="px-5 py-3 text-right font-medium text-gray-800">{formatPriceRaw(b.base_amount, lang)}</td>
                        <td className="px-5 py-3 text-right text-xs text-gray-400">−{formatPriceRaw(b.platform_fee, lang)}</td>
                        <td className="px-5 py-3 text-right font-bold text-jungle-700">{formatPriceRaw(b.net_payout, lang)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${STATUS_STYLE[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {b.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-100 bg-gray-50/50">
                      <td colSpan={3} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-gray-800">{formatPriceRaw(roomRevenue, lang)}</td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-gray-400">−{formatPriceRaw(platformFees, lang)}</td>
                      <td className="px-5 py-3 text-right font-bold text-jungle-700">{formatPriceRaw(roomNetPayout, lang)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ── POS product breakdown ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              Extras sold ({products.length} products)
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No extras sold in this period</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {products.map(p => (
                <div key={p.name} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-500'}`}>
                        {p.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-800">{formatPriceRaw(p.revenue, lang)}</p>
                    <p className="text-[11px] text-gray-400">×{p.qty} sold</p>
                  </div>
                </div>
              ))}

              {/* POS total */}
              <div className="px-5 py-3 bg-amber-50 flex items-center justify-between">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Total extras</p>
                <p className="font-bold text-amber-800">{formatPriceRaw(posRevenue, lang)}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
