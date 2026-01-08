import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeckStore, useToastStore } from '../lib/store'
import { validatePDHDeck, fetchDecklistFromUrl } from '../lib/utils'
import { getStripe, DECK_REGISTRATION_PRICE, isStripeConfigured } from '../lib/stripe'
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Check, 
  X, 
  AlertTriangle,
  Link as LinkIcon,
  FileText,
  CreditCard,
  Sparkles,
  Info
} from 'lucide-react'

const steps = [
  { id: 'deck', title: 'Deck Info' },
  { id: 'validate', title: 'Validate' },
  { id: 'payment', title: 'Payment' },
]

function RegisterDeckPage() {
  const navigate = useNavigate()
  const { commanders, fetchCommanders, registerDeck } = useDeckStore()
  const { addToast } = useToastStore()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  
  // Form state
  const [deckName, setDeckName] = useState('')
  const [selectedCommander, setSelectedCommander] = useState(null)
  const [commanderSearch, setCommanderSearch] = useState('')
  const [decklistSource, setDecklistSource] = useState('url') // 'url' or 'paste'
  const [decklistUrl, setDecklistUrl] = useState('')
  const [decklistText, setDecklistText] = useState('')
  
  // Validation state
  const [validationResult, setValidationResult] = useState(null)

  useEffect(() => {
    fetchCommanders()
  }, [fetchCommanders])

  const filteredCommanders = commanders.filter(c => 
    c.name.toLowerCase().includes(commanderSearch.toLowerCase())
  )

  const handleFetchDecklist = async () => {
    if (!decklistUrl) return
    
    setLoading(true)
    try {
      const decklist = await fetchDecklistFromUrl(decklistUrl)
      if (decklist) {
        setDecklistText(decklist)
        addToast({ type: 'success', message: 'Decklist imported successfully!' })
      } else {
        addToast({ type: 'error', message: 'Could not fetch decklist from URL' })
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to fetch decklist' })
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const result = await validatePDHDeck(decklistText)
      setValidationResult(result)
      
      if (result.valid) {
        addToast({ type: 'success', message: 'Deck validation passed!' })
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Validation failed' })
    } finally {
      setValidating(false)
    }
  }

  const handlePayment = async () => {
    if (!isStripeConfigured()) {
      // For demo/development, skip payment
      handleRegister()
      return
    }

    setLoading(true)
    try {
      const stripe = await getStripe()
      
      // In production, you'd create a checkout session via your backend
      // For now, we'll simulate the payment flow
      addToast({ 
        type: 'info', 
        message: 'Payment processing... (Demo mode - auto-completing)' 
      })
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      handleRegister()
    } catch (error) {
      addToast({ type: 'error', message: 'Payment failed' })
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      await registerDeck({
        name: deckName,
        commander_name: selectedCommander?.name || validationResult?.commander,
        commander_id: selectedCommander?.id,
        decklist_url: decklistUrl,
        decklist_text: decklistText,
        payment_status: 'completed',
        payment_amount: DECK_REGISTRATION_PRICE
      })
      
      addToast({ 
        type: 'success', 
        title: 'Deck Registered!',
        message: 'Your deck is ready for battle' 
      })
      navigate('/decks')
    } catch (error) {
      addToast({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return deckName.trim() && (selectedCommander || decklistText.trim())
      case 1:
        return validationResult?.valid
      case 2:
        return true
      default:
        return false
    }
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
          Add a new commander deck to your arsenal
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
        {/* Step 1: Deck Info */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-pale mb-2">
                Deck Name
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="input-field"
                placeholder="e.g., Tatyova Value Engine"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-pale mb-2">
                Commander (Optional - can be detected from decklist)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={commanderSearch}
                  onChange={(e) => setCommanderSearch(e.target.value)}
                  className="input-field"
                  placeholder="Search legal commanders..."
                />
                {commanderSearch && filteredCommanders.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate border border-mist rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                    {filteredCommanders.slice(0, 10).map(commander => (
                      <button
                        key={commander.id}
                        onClick={() => {
                          setSelectedCommander(commander)
                          setCommanderSearch(commander.name)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-stone transition-colors flex items-center justify-between"
                      >
                        <span className="text-pale">{commander.name}</span>
                        <span className="text-sm text-dim">{commander.color_identity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCommander && (
                <div className="mt-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-success">Selected: {selectedCommander.name}</span>
                  <button 
                    onClick={() => { setSelectedCommander(null); setCommanderSearch('') }}
                    className="text-dim hover:text-pale"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pale mb-2">
                Decklist Source
              </label>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setDecklistSource('url')}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2
                    ${decklistSource === 'url' 
                      ? 'bg-ember/20 border-ember text-ember' 
                      : 'bg-stone border-mist text-dim hover:text-pale'}`}
                >
                  <LinkIcon className="w-5 h-5" />
                  Import from URL
                </button>
                <button
                  onClick={() => setDecklistSource('paste')}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2
                    ${decklistSource === 'paste' 
                      ? 'bg-ember/20 border-ember text-ember' 
                      : 'bg-stone border-mist text-dim hover:text-pale'}`}
                >
                  <FileText className="w-5 h-5" />
                  Paste Decklist
                </button>
              </div>

              {decklistSource === 'url' ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={decklistUrl}
                      onChange={(e) => setDecklistUrl(e.target.value)}
                      className="input-field flex-1"
                      placeholder="https://moxfield.com/decks/... or https://archidekt.com/decks/..."
                    />
                    <button
                      onClick={handleFetchDecklist}
                      disabled={!decklistUrl || loading}
                      className="btn-secondary"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch'}
                    </button>
                  </div>
                  <p className="text-sm text-dim flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Supports Moxfield and Archidekt URLs
                  </p>
                </div>
              ) : null}

              <div className={decklistSource === 'paste' ? '' : 'mt-4'}>
                <textarea
                  value={decklistText}
                  onChange={(e) => setDecklistText(e.target.value)}
                  className="input-field min-h-[200px] font-mono text-sm"
                  placeholder={`1 Tatyova, Benthic Druid *CMDR*
1 Sol Ring
1 Cultivate
1 Growth Spiral
...`}
                />
                <p className="text-sm text-dim mt-2">
                  Mark your commander with *CMDR* or [Commander]
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Validation */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="font-display font-semibold text-xl text-pale mb-2">
                Validate Your Deck
              </h2>
              <p className="text-dim">
                We'll check that your deck meets PDH format requirements
              </p>
            </div>

            {!validationResult ? (
              <div className="text-center py-8">
                <button
                  onClick={handleValidate}
                  disabled={validating}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {validating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Validate Deck
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Validation Summary */}
                <div className={`p-4 rounded-lg border ${
                  validationResult.valid 
                    ? 'bg-success/10 border-success/30' 
                    : 'bg-danger/10 border-danger/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {validationResult.valid ? (
                      <Check className="w-6 h-6 text-success" />
                    ) : (
                      <X className="w-6 h-6 text-danger" />
                    )}
                    <div>
                      <p className={`font-semibold ${validationResult.valid ? 'text-success' : 'text-danger'}`}>
                        {validationResult.valid ? 'Deck is Valid!' : 'Validation Failed'}
                      </p>
                      <p className="text-sm text-dim">
                        Commander: {validationResult.commander || 'Not detected'} • 
                        {validationResult.cardCount} cards
                      </p>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-danger">Errors:</p>
                    {validationResult.errors.map((error, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-danger">
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-warning">Warnings:</p>
                    {validationResult.warnings.map((warning, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-warning">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}

                {!validationResult.valid && (
                  <button
                    onClick={() => { setValidationResult(null); setCurrentStep(0) }}
                    className="btn-secondary w-full"
                  >
                    Go Back and Fix Errors
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="font-display font-semibold text-xl text-pale mb-2">
                Complete Registration
              </h2>
              <p className="text-dim">
                Pay the registration fee to add this deck to your arsenal
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-stone/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-dim">
                <span>Deck Name</span>
                <span className="text-pale">{deckName}</span>
              </div>
              <div className="flex justify-between text-dim">
                <span>Commander</span>
                <span className="text-pale">{selectedCommander?.name || validationResult?.commander}</span>
              </div>
              <div className="border-t border-mist pt-3 flex justify-between">
                <span className="font-semibold text-pale">Registration Fee</span>
                <span className="font-display font-bold text-xl text-ember">
                  ${(DECK_REGISTRATION_PRICE / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
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
