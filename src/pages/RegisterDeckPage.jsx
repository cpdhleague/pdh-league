import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeckStore, useAuthStore, useToastStore } from '../lib/store'
import { getStripe, DECK_REGISTRATION_PRICE, isStripeConfigured } from '../lib/stripe'
import { config } from '../lib/config'
import { 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  Check, 
  CreditCard,
  Sparkles,
  Info,
  Search,
  X,
  Users
} from 'lucide-react'

const steps = config.PAYMENT_ENABLED 
  ? [
      { id: 'commander', title: 'Commander' },
      { id: 'confirm', title: 'Confirm' },
      { id: 'payment', title: 'Payment' },
    ]
  : [
      { id: 'commander', title: 'Commander' },
      { id: 'confirm', title: 'Confirm' },
    ]

function RegisterDeckPage() {
  const navigate = useNavigate()
  const { commanders, fetchCommanders, registerDeck } = useDeckStore()
  const { profile } = useAuthStore()
  const { addToast } = useToastStore()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [loadingSecondImage, setLoadingSecondImage] = useState(false)
  
  // Commander selection state
  const [commanderSearch, setCommanderSearch] = useState('')
  const [selectedCommander, setSelectedCommander] = useState(null)
  const [commanderImage, setCommanderImage] = useState(null)
  const [showCommanderDropdown, setShowCommanderDropdown] = useState(false)
  
  // Second commander (for partners)
  const [needsSecondCommander, setNeedsSecondCommander] = useState(false)
  const [partnerType, setPartnerType] = useState(null)
  const [specificPartnerName, setSpecificPartnerName] = useState(null)
  const [secondCommanderSearch, setSecondCommanderSearch] = useState('')
  const [selectedSecondCommander, setSelectedSecondCommander] = useState(null)
  const [secondCommanderImage, setSecondCommanderImage] = useState(null)
  const [showSecondCommanderDropdown, setShowSecondCommanderDropdown] = useState(false)

  useEffect(() => {
    fetchCommanders()
  }, [fetchCommanders])

  // Fetch commander image from Scryfall
  const fetchCommanderData = async (commanderName, setImage, setLoadingState) => {
    if (!commanderName) return null
    
    setLoadingState(true)
    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`
      )
      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.image_uris?.normal || 
                        data.card_faces?.[0]?.image_uris?.normal ||
                        null
        setImage(imageUrl)
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
    
    // Check for Background type
    if (typeLine.includes('Background')) {
      setNeedsSecondCommander(true)
      setPartnerType('is_background')
      setSpecificPartnerName(null)
      return
    }
    
    // Check for "Partner with X"
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
    
    // Reset second commander
    setSelectedSecondCommander(null)
    setSecondCommanderImage(null)
    setSecondCommanderSearch('')
    
    const data = await fetchCommanderData(commander.name, setCommanderImage, setLoadingImage)
    if (data) {
      checkPartnerRequirements(data)
    }
  }

  const handleSelectSecondCommander = async (commander) => {
    setSelectedSecondCommander(commander)
    setSecondCommanderSearch(commander.name)
    setShowSecondCommanderDropdown(false)
    await fetchCommanderData(commander.name, setSecondCommanderImage, setLoadingSecondImage)
  }

  const filteredCommanders = commanders.filter(c => 
    c.name.toLowerCase().includes(commanderSearch.toLowerCase()) &&
    c.is_legal !== false
  )

  const getFilteredSecondCommanders = () => {
    let filtered = commanders.filter(c =>
      c.name.toLowerCase().includes(secondCommanderSearch.toLowerCase()) &&
      c.is_legal !== false &&
      c.id !== selectedCommander?.id
    )

    if (partnerType === 'partner_with' && specificPartnerName) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase() === specificPartnerName.toLowerCase()
      )
    } else if (partnerType === 'choose_background') {
      filtered = filtered.filter(c => c.is_background === true)
    } else if (partnerType === 'is_background') {
      filtered = filtered.filter(c => c.has_choose_background === true)
    }

    return filtered
  }

  const filteredSecondCommanders = getFilteredSecondCommanders()
  const hasUnlimitedFree = profile?.is_admin || profile?.unlimited_decks

  const getPartnerLabel = () => {
    switch (partnerType) {
      case 'partner_with': return `Partner with ${specificPartnerName}`
      case 'choose_background': return 'Choose a Background'
      case 'is_background': return 'Pair with a Commander'
      case 'friends_forever': return 'Friends Forever Partner'
      case 'partner':
      default: return 'Partner Commander'
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
      const commanderName = needsSecondCommander && selectedSecondCommander
        ? `${selectedCommander.name} / ${selectedSecondCommander.name}`
        : selectedCommander.name

      await registerDeck({
        name: commanderName,
        commander_name: selectedCommander.name,
        commander_id: selectedCommander.id,
        decklist_text: null,
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
      addToast({ type: 'info', message: 'Payment processing... (Demo mode)' })
      await new Promise(resolve => setTimeout(resolve, 1500))
      await handleRegister()
    } catch (error) {
      addToast({ type: 'error', message: 'Payment failed' })
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 0) {
      return selectedCommander && (!needsSecondCommander || selectedSecondCommander)
    }
    return true
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/decks')}
        className="flex items-center gap-2 text-dim hover:text-pale mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Decks
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-pale mb-2">
          Register New Deck
        </h1>
        <p className="text-dim">
          Select your commander to register a new deck for league play
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-3 ${index <= currentStep ? 'text-pale' : 'text-dim'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold
                ${index < currentStep ? 'bg-success text-void' :
                  index === currentStep ? 'bg-ember text-void' : 'bg-stone'}`}>
                {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span className="font-medium hidden sm:block">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 sm:w-24 h-0.5 mx-4 ${index < currentStep ? 'bg-success' : 'bg-mist'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="card mb-6">
        {/* Step 1: Commander Selection */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fade-in">
            {/* Commander Selection */}
            <div>
              <label className="block text-sm font-medium text-pale mb-2">
                Commander <span className="text-ember">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={commanderSearch}
                  onChange={(e) => {
                    setCommanderSearch(e.target.value)
                    setShowCommanderDropdown(true)
                    if (!e.target.value) {
                      setSelectedCommander(null)
                      setCommanderImage(null)
                      setNeedsSecondCommander(false)
                    }
                  }}
                  onFocus={() => setShowCommanderDropdown(true)}
                  className="input-field"
                  placeholder="Search legal commanders..."
                />
                {selectedCommander && (
                  <button
                    onClick={() => {
                      setSelectedCommander(null)
                      setCommanderSearch('')
                      setCommanderImage(null)
                      setNeedsSecondCommander(false)
                      setPartnerType(null)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-pale"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                
                {showCommanderDropdown && commanderSearch && !selectedCommander && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-abyss border border-mist rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                    {filteredCommanders.length === 0 ? (
                      <div className="p-4 text-dim text-center">No commanders found</div>
                    ) : (
                      filteredCommanders.slice(0, 15).map(commander => (
                        <button
                          key={commander.id}
                          onClick={() => handleSelectCommander(commander)}
                          className="w-full px-4 py-3 text-left hover:bg-stone/50 transition-colors border-b border-mist/30 last:border-0"
                        >
                          <span className="text-pale">{commander.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedCommander && (
                <div className="mt-3 flex items-center gap-2 text-sm text-success">
                  <Check className="w-4 h-4" />
                  {selectedCommander.name} selected
                </div>
              )}
            </div>

            {/* Commander Preview */}
            {(loadingImage || commanderImage) && (
              <div className="flex justify-center">
                <div className="w-64 aspect-[488/680] bg-stone rounded-xl overflow-hidden">
                  {loadingImage ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-dim" />
                    </div>
                  ) : (
                    <img 
                      src={commanderImage} 
                      alt={selectedCommander?.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Second Commander (for partners) */}
            {needsSecondCommander && (
              <div className="p-4 bg-arcane/10 border border-arcane/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-arcane" />
                  <label className="text-sm font-medium text-pale">
                    {getPartnerLabel()} <span className="text-ember">*</span>
                  </label>
                </div>
                
                {partnerType === 'partner_with' && (
                  <p className="text-sm text-dim mb-3">
                    This commander must be paired with <span className="text-pale font-medium">{specificPartnerName}</span>.
                  </p>
                )}
                
                <div className="relative">
                  <input
                    type="text"
                    value={secondCommanderSearch}
                    onChange={(e) => {
                      setSecondCommanderSearch(e.target.value)
                      setShowSecondCommanderDropdown(true)
                    }}
                    onFocus={() => setShowSecondCommanderDropdown(true)}
                    className="input-field"
                    placeholder={partnerType === 'partner_with' ? `Search for ${specificPartnerName}...` : 'Search for partner...'}
                  />
                  
                  {showSecondCommanderDropdown && !selectedSecondCommander && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-abyss border border-mist rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                      {filteredSecondCommanders.length === 0 ? (
                        <div className="p-4 text-dim text-center">
                          {secondCommanderSearch ? 'No matching commanders' : 'Type to search...'}
                        </div>
                      ) : (
                        filteredSecondCommanders.slice(0, 15).map(commander => (
                          <button
                            key={commander.id}
                            onClick={() => handleSelectSecondCommander(commander)}
                            className="w-full px-4 py-3 text-left hover:bg-stone/50 transition-colors border-b border-mist/30 last:border-0"
                          >
                            <span className="text-pale">{commander.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedSecondCommander && (
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-success">
                      <Check className="w-4 h-4" />
                      {selectedSecondCommander.name} selected
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSecondCommander(null)
                        setSecondCommanderSearch('')
                        setSecondCommanderImage(null)
                      }}
                      className="text-dim hover:text-pale text-sm"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Second Commander Preview */}
                {(loadingSecondImage || secondCommanderImage) && (
                  <div className="flex justify-center mt-4">
                    <div className="w-48 aspect-[488/680] bg-stone rounded-xl overflow-hidden">
                      {loadingSecondImage ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-dim" />
                        </div>
                      ) : (
                        <img 
                          src={secondCommanderImage} 
                          alt={selectedSecondCommander?.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Decklist Info Blurb */}
            <div className="p-4 bg-stone/30 rounded-xl border border-mist/30">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-arcane mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-pale font-medium mb-1">No Decklist Required</p>
                  <p className="text-sm text-dim">
                    Decklists are <strong>not needed</strong> for regular league play. We encourage players 
                    to evolve their decks throughout the year and add cards from new sets!
                  </p>
                  <p className="text-sm text-dim mt-2">
                    For <strong>tournaments</strong>, decklist submission will be available on{' '}
                    <span className="text-arcane">Topdeck.gg</span>. For <strong>deckbuilding contests</strong>, 
                    submission guidelines will be posted on the Contests page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="font-display font-semibold text-xl text-pale mb-2">
                Confirm Registration
              </h2>
              <p className="text-dim">
                Review your deck before completing registration
              </p>
            </div>

            {/* Commander Preview(s) */}
            <div className={`flex justify-center gap-4 ${needsSecondCommander && selectedSecondCommander ? '' : ''}`}>
              {commanderImage && (
                <div className="w-48 aspect-[488/680] bg-stone rounded-xl overflow-hidden">
                  <img 
                    src={commanderImage} 
                    alt={selectedCommander?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {needsSecondCommander && secondCommanderImage && (
                <div className="w-48 aspect-[488/680] bg-stone rounded-xl overflow-hidden">
                  <img 
                    src={secondCommanderImage} 
                    alt={selectedSecondCommander?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-stone/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-dim">
                <span>Commander</span>
                <span className="text-pale">{selectedCommander?.name}</span>
              </div>
              {needsSecondCommander && selectedSecondCommander && (
                <div className="flex justify-between text-dim">
                  <span>Partner</span>
                  <span className="text-pale">{selectedSecondCommander.name}</span>
                </div>
              )}
              <div className="border-t border-mist pt-3 flex justify-between">
                <span className="font-semibold text-pale">Registration Fee</span>
                {hasUnlimitedFree ? (
                  <span className="font-display font-bold text-xl text-arcane">FREE (Unlimited)</span>
                ) : config.PAYMENT_ENABLED ? (
                  <span className="font-display font-bold text-xl text-ember">
                    ${(DECK_REGISTRATION_PRICE / 100).toFixed(2)}
                  </span>
                ) : (
                  <span className="font-display font-bold text-xl text-success">FREE (Beta)</span>
                )}
              </div>
            </div>

            {/* Register Button (for non-payment flow) */}
            {!config.PAYMENT_ENABLED || hasUnlimitedFree ? (
              <>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Register Deck
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-dim">
                  🎉 Registration is free during the beta period!
                </p>
              </>
            ) : null}
          </div>
        )}

        {/* Step 3: Payment (only if enabled) */}
        {currentStep === 2 && config.PAYMENT_ENABLED && !hasUnlimitedFree && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="font-display font-semibold text-xl text-pale mb-2">
                Complete Payment
              </h2>
              <p className="text-dim">
                Pay the registration fee to add this deck to your arsenal
              </p>
            </div>

            <div className="bg-stone/50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="font-semibold text-pale">Registration Fee</span>
                <span className="font-display font-bold text-xl text-ember">
                  ${(DECK_REGISTRATION_PRICE / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePaymentAndRegister}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay & Register Deck
                </>
              )}
            </button>
            <p className="text-center text-sm text-dim">
              Secure payment powered by Stripe
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {currentStep < steps.length - 1 && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
            className="btn-primary flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default RegisterDeckPage
