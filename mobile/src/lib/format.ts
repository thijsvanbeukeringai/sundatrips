// Currency formatting — IDR only, matching the web app (lib/currency.ts).
// Implemented manually because Hermes (React Native's JS engine) has limited
// Intl locale support, so toLocaleString('id-ID') is not reliable.

export function formatPrice(amount: number): string {
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? '-' : ''
  const digits = Math.abs(rounded).toString()
  // Group thousands with a dot, the Indonesian convention.
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `Rp ${sign}${grouped}`
}

const PRICE_UNIT_LABELS: Record<string, string> = {
  night: 'night',
  person: 'person',
  session: 'session',
  day: 'day',
  trip: 'trip',
  vehicle: 'vehicle',
}

export function priceUnitLabel(unit: string): string {
  return PRICE_UNIT_LABELS[unit] ?? unit
}
