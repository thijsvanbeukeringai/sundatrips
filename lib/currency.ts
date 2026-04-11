// ─── Exchange rate config ─────────────────────────────────────────────────────
// Change EUR_TO_IDR here to update the rate everywhere.
export const EUR_TO_IDR = 19_800

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatPrice(eurAmount: number, lang: 'en' | 'id'): string {
  if (lang === 'id') {
    const idr = Math.round(eurAmount * EUR_TO_IDR)
    return `Rp ${idr.toLocaleString('id-ID')}`
  }
  return `€${eurAmount.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatPriceRaw(eurAmount: number, lang: 'en' | 'id'): string {
  if (lang === 'id') {
    const idr = Math.round(eurAmount * EUR_TO_IDR)
    return `Rp ${idr.toLocaleString('id-ID')}`
  }
  return `€${eurAmount.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
