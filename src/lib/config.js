/**
 * PDH League Configuration
 * 
 * PAYMENT TOGGLE
 * ==============
 * Set this to true when you're ready to enable Stripe payments.
 * When false, deck registration is free and skips the payment step.
 * 
 * To enable payments:
 * 1. Set PAYMENT_ENABLED to true
 * 2. Make sure your .env file has VITE_STRIPE_PUBLISHABLE_KEY set
 * 3. Redeploy to Vercel
 */

export const config = {
  // =====================================================
  // CHANGE THIS TO true WHEN READY FOR PAID REGISTRATION
  // =====================================================
  PAYMENT_ENABLED: false,
  
  // Registration fee in dollars (only used when PAYMENT_ENABLED is true)
  DECK_REGISTRATION_FEE: 5,
  
  // App info
  APP_NAME: 'PDH League',
  APP_VERSION: '1.0.0',
  
  // ELO settings
  STARTING_ELO: 1000,  // Changed to start in middle of Silver
  K_FACTOR_NEW: 32,      // For decks with < 30 games
  K_FACTOR_EXPERIENCED: 24,  // For decks with 30+ games
  GAMES_UNTIL_EXPERIENCED: 30,
  
  // ELO Tiers (deck-based ELO)
  ELO_TIERS: [
    { name: 'Bronze', min: 0, max: 799, color: 'text-orange-600', bgColor: 'bg-orange-600/20' },
    { name: 'Silver', min: 800, max: 999, color: 'text-gray-300', bgColor: 'bg-gray-300/20' },
    { name: 'Gold', min: 1000, max: 1199, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
    { name: 'Platinum', min: 1200, max: 1299, color: 'text-emerald-400', bgColor: 'bg-emerald-400/20' },
    { name: 'Diamond', min: 1300, max: 1399, color: 'text-cyan-400', bgColor: 'bg-cyan-400/20' },
    { name: 'Mythic', min: 1400, max: 99999, color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
  ],
  
  // Year 1 Results Link (update this with your spreadsheet link)
  YEAR_1_RESULTS_URL: 'https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID',
}

export default config
