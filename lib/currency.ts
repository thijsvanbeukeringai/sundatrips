// ─── Live exchange rate ────────────────────────────────────────────────────────
// Updated at runtime by the LanguageProvider from the Frankfurter API.
// Falls back to a recent rate if the fetch fails.
let EUR_TO_IDR = 19_800

export { EUR_TO_IDR }

export function setExchangeRate(rate: number) {
  if (rate > 0) EUR_TO_IDR = rate
}

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
