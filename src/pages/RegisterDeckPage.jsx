import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeckStore, useAuthStore, useToastStore } from '../lib/store'
import { getStripe, DECK_REGISTRATION_PRICE, isStripeConfigured } from '../lib/stripe'
import { config } from '../lib/config'
import { 
  ArrowLeft, 
  Loader2, 
  Check, 
  CreditCard,
  Sparkles,
  Info,
  Search,
  X,
  Users,
  HelpCircle
} from 'lucide-react'

function RegisterDeckPage() {
  const navigate = useNavigate()
  const { commanders, fetchCommanders, registerDeck } = useDeckStore()
  const { profile } = useAuthStore()
  const { addToast } = useToastStore()
  
  const [loading, setLoading] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [loadingSecondImage, setLoadingSecondImage] = useState(false)
  
  // Commander selection state
  const [commanderSearch, setCommanderSearch] = useState('')
  const [selectedCommander, setSelectedCommander] = useState(null)
  const [commanderImage, setCommanderImage] = useState(null)
  const [commanderData, setCommanderData] = useState(null)
  const [showCommanderDropdown, setShowCommanderDropdown] = useState(false)
  
  // Second commander (for partners)
  const [needsSecondCommander, setNeedsSecondCommander] = useState(false)
  const [partnerType, setPartnerType] = useState(null) // 'partner', 'partner_with', 'background', 'friends_forever'
  const [specificPartnerName, setSpecificPartnerName] = useState(null) // For "Partner with X"
  const [secondCommanderSearch, setSecondCommanderSearch] = useState('')
  const [selectedSecondCommander, setSelectedSecondCommander] = useState(null)
  const [secondCommanderImage, setSecondCommanderImage] = useState(null)
  const [showSecondCommanderDropdown, setShowSecondCommanderDropdown] = useState(false)
  
  // Optional decklist
  const [decklistText, setDecklistText] = useState('')
  const [showDecklistSection, setShowDecklistSection] = useState(false)

  useEffect(() => {
    fetchCommanders()
  }, [fetchCommanders])

  // Fetch commander image and data from Scryfall
  const fetchCommanderData = async (commanderName, setImage, setData, setLoadingState) => {
    if (!commanderName) return null
    
    setLoadingState(true)
    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`
      )
      if (response.ok) {
        const data = await response.json()
        // Get the normal image, or card face image for double-faced cards
        const imageUrl = data.image_uris?.normal || 
                        data.card_faces?.[0]?.image_uris?.normal ||
                        null
        setImage(imageUrl)
        if (setData) setData(data)
        return data
      }
    } catch (error) {
      console.error('Failed to fetch commander data:', error)
    } finally {
      setLoadingState(false)
    }
    return null
  }

  // Check if commander has partner ability
  const checkPartnerRequirements = (cardData) => {
    if (!cardData) return
    
    const oracleText = cardData.oracle_text || ''
    const keywords = cardData.keywords || []
    const typeLine = cardData.type_line || ''
    
    // Check for Background type (this card IS a background)
    if (typeLine.includes('Background')) {
      setNeedsSecondCommander(true)
      setPartnerType('is_background')
      setSpecificPartnerName(null)
      return
    }
    
    // Check for "Partner with X" (specific pairing)
    const partnerWithMatch = oracleText.match(/Partner with ([^(\n]+)/i)
    if (partnerWithMatch) {
      setNeedsSecondCommander(true)
      setPartnerType('partner_with')
      setSpecificPartnerName(partnerWithMatch[1].trim())
      return
    }
    
    // Check for generic Partner
    if (keywords.includes('Partner') || /\bPartner\b/.test(oracleText)) {
      setNeedsSecondCommander(true)
      setPartnerType('partner')
      setSpecificPartnerName(null)
      return
    }
    
    // Check for Choose a Background
    if (keywords.includes('Choose a Background') || oracleText.includes('Choose a Background')) {
      setNeedsSecondCommander(true)
      setPartnerType('choose_background')
      setSpecificPartnerName(null)
      return
    }
    
    // Check for Friends forever
    if (keywords.includes('Friends forever') || oracleText.includes('Friends forever')) {
      setNeedsSecondCommander(true)
      setPartnerType('friends_forever')
      setSpecificPartnerName(null)
      return
    }
    
    // No partner ability
    setNeedsSecondCommander(false)
    setPartnerType(null)
    setSpecificPartnerName(null)
    setSelectedSecondCommander(null)
    setSecondCommanderImage(null)
    setSecondCommanderSearch('')
  }

  const handleSelectCommander = async (commander) => {
    setSelectedCommander(commander)
    setCommanderSearch(commander.name)
    setShowCommanderDropdown(false)
    
    // Reset second commander when first changes
    setSelectedSecondCommander(null)
    setSecondCommanderImage(null)
    setSecondCommanderSearch('')
    
    const data = await fetchCommanderData(commander.name, setCommanderImage, setCommanderData, setLoadingImage)
    if (data) {
      checkPartnerRequirements(data)
    }
  }

  const handleSelectSecondCommander = async (commander) => {
    setSelectedSecondCommander(commander)
    setSecondCommanderSearch(commander.name)
    setShowSecondCommanderDropdown(false)
    await fetchCommanderData(commander.name, setSecondCommanderImage, null, setLoadingSecondImage)
  }

  const filteredCommanders = commanders.filter(c => 
    c.name.toLowerCase().includes(commanderSearch.toLowerCase()) &&
    c.is_legal !== false
  )

  // Filter second commanders based on partner type
  const getFilteredSecondCommanders = () => {
    let filtered = commanders.filter(c =>
      c.name.toLowerCase().includes(secondCommanderSearch.toLowerCase()) &&
      c.is_legal !== false &&
      c.id !== selectedCommander?.id
    )

    // Apply partner-type specific filtering
    if (partnerType === 'partner_with' && specificPartnerName) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase() === specificPartnerName.toLowerCase()
      )
    } else if (partnerType === 'choose_background') {
      filtered = filtered.filter(c => c.is_background === true)
    } else if (partnerType === 'is_background') {
      filtered = filtered.filter(c => c.has_choose_background === true)
    }
    // For 'partner' and 'friends_forever', allow any valid partner from the list

    return filtered
  }

  const filteredSecondCommanders = getFilteredSecondCommanders()

  // Check if user has unlimited free registration (admin or special role)
  const hasUnlimitedFree = profile?.is_admin || profile?.unlimited_decks

  const getPartnerLabel = () => {
    switch (partnerType) {
      case 'partner_with':
        return `Partner with ${specificPartnerName}`
      case 'choose_background':
        return 'Choose a Background'
      case 'is_background':
        return 'Pair with a Commander'
      case 'friends_forever':
        return 'Friends Forever Partner'
      case 'partner':
      default:
        return 'Partner Commander'
    }
  }

  const handleRegister = async () => {
    if (!selectedCommander) {
      addToast({ type: 'error', message: 'Please select a commander' })
      return
    }

    if (needsSecondCommander && !selectedSecondCommander) {
      addToast({ type: 'error', message: 'Please select a partner commander' })
      return
    }

    setLoading(true)
    try {
      // Build commander name (include partner if applicable)
      const commanderName = needsSecondCommander && selectedSecondCommander
        ? `${selectedCommander.name} / ${selectedSecondCommander.name}`
        : selectedCommander.name

      await registerDeck({
        name: commanderName, // Use commander name as deck identifier
        commander_name: selectedCommander.name,
        commander_id: selectedCommander.id,
        second_commander_name: selectedSecondCommander?.name || null,
        second_commander_id: selectedSecondCommander?.id || null,
        decklist_text: decklistText || null,
        payment_status: hasUnlimitedFree ? 'free_unlimited' : (config.PAYMENT_ENABLED ? 'completed' : 'free_beta'),
        payment_amount: hasUnlimitedFree ? 0 : (config.PAYMENT_ENABLED ? DECK_REGISTRATION_PRICE : 0)
      })
      
      addToast({ 
        type: 'success', 
        title: 'Deck Registered!',
        message: `${commanderName} is ready for battle` 
      })
      navigate('/decks')
    } catch (error) {
      addToast({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentAndRegister = async () => {
    if (!isStripeConfigured() || hasUnlimitedFree) {
      handleRegister()
      return
    }

    setLoading(true)
    try {
      const stripe = await getStripe()
      
      addToast({ 
        type: 'info', 
        message: 'Payment processing... (Demo mode - auto-completing)' 
      })
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      await handleRegister()
    } catch (error) {
      addToast({ type: 'error', message: 'Payment failed' })
      setLoading(false)
    }
  }

  const canRegister = selectedCommander && (!needsSecondCommander || selectedSecondCommander)

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/decks')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Decks
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-white mb-2">
          Register New Deck
        </h1>
        <p className="text-gray-400">
          Select your commander to register a new deck for league play
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Selection */}
        <div className="space-y-6">
          {/* Commander Selection */}
          <div className="card p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Commander <span className="text-ember">*</span>
            </label>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={commanderSearch}
                  onChange={(e) => {
                    setCommanderSearch(e.target.value)
                    setShowCommanderDropdown(true)
                    if (!e.target.value) {
                      setSelectedCommander(null)
                      setCommanderImage(null)
                      setCommanderData(null)
                      setNeedsSecondCommander(false)
                    }
                  }}
                  onFocus={() => setShowCommanderDropdown(true)}
                  className="input pl-10 pr-10"
                  placeholder="Search for your commander..."
                />
                {selectedCommander && (
                  <button
                    onClick={() => {
                      setSelectedCommander(null)
                      setCommanderSearch('')
                      setCommanderImage(null)
                      setCommanderData(null)
                      setNeedsSecondCommander(false)
                      setPartnerType(null)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {showCommanderDropdown && commanderSearch && !selectedCommander && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-abyss border border-gray-800 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                  {filteredCommanders.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">
                      No commanders found
                    </div>
                  ) : (
                    filteredCommanders.slice(0, 15).map(commander => (
                      <button
                        key={commander.id}
                        onClick={() => handleSelectCommander(commander)}
                        className="w-full px-4 py-3 text-left hover:bg-slate transition-colors flex items-center gap-3"
                      >
                        <span className="text-white">{commander.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCommander && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                <Check className="w-4 h-4" />
                Commander selected
              </div>
            )}
          </div>

          {/* Second Commander (for partners) */}
          {needsSecondCommander && (
            <div className="card p-6 border-arcane/30 bg-arcane/5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-arcane" />
                <label className="text-sm font-medium text-white">
                  {getPartnerLabel()} <span className="text-ember">*</span>
                </label>
              </div>
              
              {partnerType === 'partner_with' && (
                <p className="text-sm text-gray-400 mb-3">
                  This commander must be paired with <span className="text-white font-medium">{specificPartnerName}</span>.
                </p>
              )}
              
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={secondCommanderSearch}
                    onChange={(e) => {
                      setSecondCommanderSearch(e.target.value)
                      setShowSecondCommanderDropdown(true)
                    }}
                    onFocus={() => setShowSecondCommanderDropdown(true)}
                    className="input pl-10"
                    placeholder={partnerType === 'partner_with' ? `Search for ${specificPartnerName}...` : 'Search for partner...'}
                  />
                </div>
                
                {showSecondCommanderDropdown && !selectedSecondCommander && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-abyss border border-gray-800 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                    {filteredSecondCommanders.length === 0 ? (
                      <div className="p-4 text-gray-500 text-center">
                        {secondCommanderSearch ? 'No matching commanders found' : 'Type to search...'}
                      </div>
                    ) : (
                      filteredSecondCommanders.slice(0, 15).map(commander => (
                        <button
                          key={commander.id}
                          onClick={() => handleSelectSecondCommander(commander)}
                          className="w-full px-4 py-3 text-left hover:bg-slate transition-colors"
                        >
                          <span className="text-white">{commander.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedSecondCommander && (
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Check className="w-4 h-4" />
                    {selectedSecondCommander.name} selected
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSecondCommander(null)
                      setSecondCommanderSearch('')
                      setSecondCommanderImage(null)
                    }}
                    className="text-gray-500 hover:text-white text-sm"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Optional Decklist */}
          <div className="card p-6">
            <button
              onClick={() => setShowDecklistSection(!showDecklistSection)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-white">
                  Add Decklist (Optional)
                </span>
              </div>
              <span className="text-gray-500 text-sm">
                {showDecklistSection ? '−' : '+'}
              </span>
            </button>

            {showDecklistSection && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate/50 rounded-lg border border-gray-800">
                  <p className="text-sm text-gray-400">
                    <Info className="w-4 h-4 inline mr-1 text-arcane" />
                    Decklists are <strong className="text-white">not required</strong> for regular league play. 
                    We encourage players to evolve their decks throughout the year and add cards from new sets!
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Decklists are only needed for <strong>tournament events</strong> or <strong>deckbuilding contests</strong>.
                  </p>
                </div>
                
                <textarea
                  value={decklistText}
                  onChange={(e) => setDecklistText(e.target.value)}
                  className="input min-h-[150px] font-mono text-sm"
                  placeholder={`1 Sol Ring
1 Command Tower
1 Arcane Signet
...`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview & Checkout */}
        <div className="space-y-6">
          {/* Commander Preview */}
          <div className="card p-6">
            <h3 className="text-lg font-display font-bold text-white mb-4">
              Preview
            </h3>
            
            <div className={`grid ${needsSecondCommander && selectedSecondCommander ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              {/* First Commander Image */}
              <div className="aspect-[488/680] bg-slate rounded-xl overflow-hidden flex items-center justify-center">
                {loadingImage ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                ) : commanderImage ? (
                  <img 
                    src={commanderImage} 
                    alt={selectedCommander?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-abyss mx-auto mb-3 flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-700" />
                    </div>
                    <p className="text-gray-600 text-sm">
                      Select a commander to see preview
                    </p>
                  </div>
                )}
              </div>

              {/* Second Commander Image (if partner) */}
              {needsSecondCommander && (
                <div className="aspect-[488/680] bg-slate rounded-xl overflow-hidden flex items-center justify-center">
                  {loadingSecondImage ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                  ) : secondCommanderImage ? (
                    <img 
                      src={secondCommanderImage} 
                      alt={selectedSecondCommander?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-abyss mx-auto mb-3 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-700" />
                      </div>
                      <p className="text-gray-600 text-sm">
                        Select a partner
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedCommander && (
              <div className="mt-4 text-center">
                <p className="text-white font-medium">
                  {selectedCommander.name}
                  {selectedSecondCommander && ` / ${selectedSecondCommander.name}`}
                </p>
              </div>
            )}
          </div>

          {/* Registration Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-display font-bold text-white mb-4">
              Registration Summary
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Commander</span>
                <span className="text-white">
                  {selectedCommander?.name || '—'}
                </span>
              </div>
              {needsSecondCommander && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Partner</span>
                  <span className="text-white">
                    {selectedSecondCommander?.name || '—'}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Decklist</span>
                <span className="text-white">
                  {decklistText ? 'Included' : 'Not required'}
                </span>
              </div>
              <div className="border-t border-gray-800 pt-3 flex justify-between">
                <span className="font-medium text-white">Registration Fee</span>
                {hasUnlimitedFree ? (
                  <span className="font-display font-bold text-lg text-arcane">
                    FREE (Unlimited)
                  </span>
                ) : config.PAYMENT_ENABLED ? (
                  <span className="font-display font-bold text-lg text-ember">
                    ${(DECK_REGISTRATION_PRICE / 100).toFixed(2)}
                  </span>
                ) : (
                  <span className="font-display font-bold text-lg text-green-400">
                    FREE (Beta)
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={config.PAYMENT_ENABLED && !hasUnlimitedFree ? handlePaymentAndRegister : handleRegister}
              disabled={!canRegister || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : config.PAYMENT_ENABLED && !hasUnlimitedFree ? (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay & Register
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Register Deck
                </>
              )}
            </button>

            {config.PAYMENT_ENABLED && !hasUnlimitedFree && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Secure payment powered by Stripe
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterDeckPage
