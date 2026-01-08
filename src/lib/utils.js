// Scryfall API utilities for deck validation
const SCRYFALL_API = 'https://api.scryfall.com'

// Fetch card data from Scryfall
export async function fetchCard(cardName) {
  try {
    const response = await fetch(
      `${SCRYFALL_API}/cards/named?fuzzy=${encodeURIComponent(cardName)}`
    )
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Scryfall fetch error:', error)
    return null
  }
}

// Check if a card is legal in PDH (Pauper EDH)
// Rules: Commander must be uncommon creature
// 99 cards that have been printed at common
export function isPDHLegalCommander(card) {
  if (!card) return false
  
  // Must be a creature
  if (!card.type_line?.toLowerCase().includes('creature')) {
    return false
  }
  
  // Must have been printed at uncommon
  // Check if any printing is uncommon
  return card.rarity === 'uncommon'
}

export function isPDHLegalCard(card) {
  if (!card) return false
  
  // Card must have been printed at common
  return card.rarity === 'common'
}

// Parse a decklist from various formats
export function parseDecklist(text) {
  const lines = text.trim().split('\n')
  const cards = []
  let commander = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue
    
    // Check for commander designation
    const isCommander = /\*CMDR\*|\[Commander\]|Commander:/i.test(trimmed)
    
    // Parse quantity and card name
    // Formats: "1 Card Name", "1x Card Name", "Card Name"
    const match = trimmed.match(/^(\d+)x?\s+(.+?)(?:\s*\*CMDR\*|\s*\[Commander\])?$/i)
    
    if (match) {
      const quantity = parseInt(match[1], 10)
      const name = match[2].replace(/\s*\*CMDR\*|\s*\[Commander\]/gi, '').trim()
      
      if (isCommander) {
        commander = { name, quantity }
      } else {
        cards.push({ name, quantity })
      }
    } else {
      // Just a card name
      const name = trimmed.replace(/\s*\*CMDR\*|\s*\[Commander\]/gi, '').trim()
      if (isCommander) {
        commander = { name, quantity: 1 }
      } else {
        cards.push({ name, quantity: 1 })
      }
    }
  }
  
  return { commander, cards }
}

// Validate a full PDH deck
export async function validatePDHDeck(decklistText) {
  const { commander, cards } = parseDecklist(decklistText)
  const errors = []
  const warnings = []
  
  // Check commander
  if (!commander) {
    errors.push('No commander specified. Mark your commander with *CMDR* or [Commander]')
  } else {
    const commanderCard = await fetchCard(commander.name)
    if (!commanderCard) {
      errors.push(`Commander "${commander.name}" not found`)
    } else if (!isPDHLegalCommander(commanderCard)) {
      errors.push(`"${commander.name}" is not a legal PDH commander (must be uncommon creature)`)
    }
  }
  
  // Check deck size
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  if (totalCards !== 99) {
    errors.push(`Deck has ${totalCards} cards, should have exactly 99 (plus commander)`)
  }
  
  // Check for duplicate cards (singleton format)
  const cardCounts = {}
  for (const card of cards) {
    // Basic lands can have multiples
    const isBasicLand = /^(Plains|Island|Swamp|Mountain|Forest|Snow-Covered .+)$/i.test(card.name)
    
    if (!isBasicLand && card.quantity > 1) {
      errors.push(`"${card.name}" appears ${card.quantity} times (singleton format allows only 1)`)
    }
    
    cardCounts[card.name.toLowerCase()] = (cardCounts[card.name.toLowerCase()] || 0) + card.quantity
  }
  
  // Sample validation for card legality (checking first few non-land cards)
  // Full validation would check all cards
  const nonLandCards = cards.filter(c => 
    !/^(Plains|Island|Swamp|Mountain|Forest|Snow-Covered .+)$/i.test(c.name)
  ).slice(0, 5)
  
  for (const card of nonLandCards) {
    const cardData = await fetchCard(card.name)
    if (!cardData) {
      warnings.push(`Could not verify "${card.name}"`)
    } else if (!isPDHLegalCard(cardData) && cardData.rarity !== 'common') {
      errors.push(`"${card.name}" is not legal in PDH (must be common)`)
    }
  }
  
  if (nonLandCards.length < cards.filter(c => 
    !/^(Plains|Island|Swamp|Mountain|Forest|Snow-Covered .+)$/i.test(c.name)
  ).length) {
    warnings.push('Only first 5 non-land cards were validated. Full validation happens on registration.')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    commander: commander?.name,
    cardCount: totalCards + (commander ? 1 : 0)
  }
}

// Extract decklist from Moxfield/Archidekt URLs
export async function fetchDecklistFromUrl(url) {
  // For Moxfield
  if (url.includes('moxfield.com')) {
    const deckId = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/)?.[1]
    if (deckId) {
      try {
        const response = await fetch(`https://api2.moxfield.com/v2/decks/all/${deckId}`)
        if (response.ok) {
          const data = await response.json()
          return formatMoxfieldDeck(data)
        }
      } catch (error) {
        console.error('Moxfield fetch error:', error)
      }
    }
  }
  
  // For Archidekt - they have a public API
  if (url.includes('archidekt.com')) {
    const deckId = url.match(/archidekt\.com\/decks\/(\d+)/)?.[1]
    if (deckId) {
      try {
        const response = await fetch(`https://archidekt.com/api/decks/${deckId}/`)
        if (response.ok) {
          const data = await response.json()
          return formatArchidektDeck(data)
        }
      } catch (error) {
        console.error('Archidekt fetch error:', error)
      }
    }
  }
  
  return null
}

function formatMoxfieldDeck(data) {
  let decklist = ''
  
  // Add commander
  if (data.commanders) {
    for (const [name, card] of Object.entries(data.commanders)) {
      decklist += `1 ${card.card.name} *CMDR*\n`
    }
  }
  
  // Add main deck
  if (data.mainboard) {
    for (const [name, card] of Object.entries(data.mainboard)) {
      decklist += `${card.quantity} ${card.card.name}\n`
    }
  }
  
  return decklist
}

function formatArchidektDeck(data) {
  let decklist = ''
  
  for (const card of data.cards || []) {
    const isCommander = card.categories?.includes('Commander')
    decklist += `${card.quantity} ${card.card.oracleCard.name}${isCommander ? ' *CMDR*' : ''}\n`
  }
  
  return decklist
}

// ELO calculation utilities
const K_FACTOR = 32 // Standard K-factor for new players
const K_FACTOR_ESTABLISHED = 24 // For players with 30+ games

export function calculateEloChange(playerElo, opponentElos, placement, matchesPlayed = 0) {
  // Calculate average opponent Elo
  const avgOpponentElo = opponentElos.reduce((a, b) => a + b, 0) / opponentElos.length
  
  // Expected score based on Elo difference
  const expectedScore = 1 / (1 + Math.pow(10, (avgOpponentElo - playerElo) / 400))
  
  // Actual score based on placement (1st = 1.0, 2nd = 0.66, 3rd = 0.33, 4th = 0)
  const actualScore = [1.0, 0.66, 0.33, 0][placement - 1] || 0
  
  // K-factor based on experience
  const k = matchesPlayed >= 30 ? K_FACTOR_ESTABLISHED : K_FACTOR
  
  // Calculate Elo change
  const change = Math.round(k * (actualScore - expectedScore))
  
  return change
}

// Format numbers with commas
export function formatNumber(num) {
  return num.toLocaleString()
}

// Format date relative to now
export function formatRelativeTime(date) {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now - then) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return then.toLocaleDateString()
}

// Generate a random lobby code
export function generateLobbyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Color identity utilities for MTG
export const COLOR_IDENTITY = {
  W: { name: 'White', color: '#F8F6D8' },
  U: { name: 'Blue', color: '#0E68AB' },
  B: { name: 'Black', color: '#150B00' },
  R: { name: 'Red', color: '#D3202A' },
  G: { name: 'Green', color: '#00733E' }
}

export function getColorIdentityDisplay(colors) {
  if (!colors || colors.length === 0) return 'Colorless'
  return colors.map(c => COLOR_IDENTITY[c]?.name || c).join('/')
}

// Get ELO tier for a given rating
export function getEloTier(elo) {
  const tiers = [
    { name: 'Bronze', min: 0, max: 799, color: 'text-orange-600', bgColor: 'bg-orange-600/20', borderColor: 'border-orange-600/30' },
    { name: 'Silver', min: 800, max: 999, color: 'text-gray-300', bgColor: 'bg-gray-300/20', borderColor: 'border-gray-300/30' },
    { name: 'Gold', min: 1000, max: 1199, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' },
    { name: 'Platinum', min: 1200, max: 1299, color: 'text-emerald-400', bgColor: 'bg-emerald-400/20', borderColor: 'border-emerald-400/30' },
    { name: 'Diamond', min: 1300, max: 1399, color: 'text-cyan-400', bgColor: 'bg-cyan-400/20', borderColor: 'border-cyan-400/30' },
    { name: 'Mythic', min: 1400, max: 99999, color: 'text-red-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' },
  ]
  
  return tiers.find(t => elo >= t.min && elo <= t.max) || tiers[0]
}

// Get highest ELO from an array of decks
export function getHighestDeckElo(decks) {
  if (!decks || decks.length === 0) return 0
  return Math.max(...decks.map(d => d.elo || 1000))
}

// Calculate median from an array of numbers
export function calculateMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  return sorted[middle]
}

// Format date for display
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
