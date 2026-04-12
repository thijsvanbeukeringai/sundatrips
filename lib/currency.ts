// ─── Currency: IDR only ─────────────────────────────────────────────────────
// The platform uses Indonesian Rupiah (IDR) as the sole currency.
// Prices are stored in IDR in the database.

// Legacy: exchange rate kept for backward compatibility with old EUR data
let EUR_TO_IDR = 19_800

export { EUR_TO_IDR }

export function setExchangeRate(rate: number) {
  if (rate > 0) EUR_TO_IDR = rate
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Format a price amount as IDR (always, regardless of language) */
export function formatPrice(amount: number, _lang?: 'en' | 'id'): string {
  const rounded = Math.round(amount)
  return `Rp ${rounded.toLocaleString('id-ID')}`
}

/** Format a price amount as IDR (always, regardless of language) */
export function formatPriceRaw(amount: number, _lang?: 'en' | 'id'): string {
  const rounded = Math.round(amount)
  return `Rp ${rounded.toLocaleString('id-ID')}`
}
