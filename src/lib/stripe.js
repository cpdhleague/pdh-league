import { loadStripe } from '@stripe/stripe-js'

// Your Stripe publishable key from the Stripe Dashboard
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'YOUR_STRIPE_PUBLISHABLE_KEY'

let stripePromise = null

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey !== 'YOUR_STRIPE_PUBLISHABLE_KEY') {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise
}

// Deck registration price in cents (e.g., $5 = 500)
export const DECK_REGISTRATION_PRICE = 500

// Check if Stripe is configured
export const isStripeConfigured = () => {
  return stripePublishableKey !== 'YOUR_STRIPE_PUBLISHABLE_KEY'
}
