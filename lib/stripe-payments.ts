import { getStripe, toCents } from './stripe'

/**
 * Create a PaymentIntent on the connected account (owner's Stripe),
 * with a platform application fee of 1%.
 *
 * Returns the client_secret to pass to Stripe.js on the frontend,
 * or null if the owner has no Stripe account yet.
 */
export async function createBookingPaymentIntent({
  bookingId,
  totalEuros,
  ownerStripeAccountId,
  guestEmail,
  description,
}: {
  bookingId:            string
  totalEuros:           number
  ownerStripeAccountId: string
  guestEmail:           string
  description:          string
}) {
  const stripe     = getStripe()
  const totalCents = toCents(totalEuros)
  const feeCents   = Math.round(totalCents * 0.01) // 1% platform fee

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount:                  totalCents,
      currency:                'eur',
      application_fee_amount:  feeCents,
      receipt_email:           guestEmail,
      description,
      metadata: { booking_id: bookingId },
    },
    {
      stripeAccount: ownerStripeAccountId,  // charge on behalf of owner
    }
  )

  return {
    clientSecret:    paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

/**
 * Retrieve a Stripe Express account's dashboard login link.
 * Owners can open this to see their payouts & transfers.
 */
export async function getExpressDashboardLink(stripeAccountId: string) {
  const link = await getStripe().accounts.createLoginLink(stripeAccountId)
  return link.url
}
