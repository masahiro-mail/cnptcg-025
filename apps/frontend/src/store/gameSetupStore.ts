import { create } from 'zustand'
import { 
  GameSetupState, 
  GameSetupPhase, 
  PlayerSetupState, 
  ReikiConfiguration,
  DeckValidationResult,
  MulliganData,
  SetupProgress,
  DeckPreview,
  SetupError
} from '../types/game-setup'
import { UnifiedCard, DeckBuilderCard } from '../types/deckbuilder-card'

interface GameSetupStore {
  // Setup state
  setupState: GameSetupState | null
  currentPhase: GameSetupPhase
  myPlayerId: string | null
  
  // Current step data
  deckInput: string
  deckValidation: DeckValidationResult | null
  deckPreview: DeckPreview | null
  reikiConfig: ReikiConfiguration
  mulliganData: MulliganData
  progress: SetupProgress | null
  error: SetupError | null
  
  // UI state
  isLoading: boolean
  showPreview: boolean
  showMulliganConfirm: boolean
  timeRemaining: number
  
  // Actions
  setSetupState: (state: GameSetupState) => void
  setCurrentPhase: (phase: GameSetupPhase) => void
  setMyPlayerId: (id: string) => void
  
  // Deck input actions
  setDeckInput: (deckId: string) => void
  setDeckValidation: (result: DeckValidationResult | null) => void
  setDeckPreview: (preview: DeckPreview | null) => void
  validateDeck: (deckId: string) => Promise<DeckValidationResult>
  
  // REIKI selection actions
  setReikiConfig: (config: ReikiConfiguration) => void
  updateReikiColor: (color: keyof ReikiConfiguration, count: number) => void
  canUpdateReikiColor: (color: keyof ReikiConfiguration, delta: number) => boolean
  
  // Mulligan actions
  setMulliganData: (data: MulliganData) => void
  toggleMulliganCard: (index: number) => void
  confirmMulligan: () => void
  
  // Progress and error actions
  setProgress: (progress: SetupProgress) => void
  setError: (error: SetupError | null) => void
  clearError: () => void
  
  // UI actions
  setIsLoading: (loading: boolean) => void
  setShowPreview: (show: boolean) => void
  setShowMulliganConfirm: (show: boolean) => void
  setTimeRemaining: (time: number) => void
  
  // Computed properties
  getMySetupState: () => PlayerSetupState | null
  getOpponentSetupState: () => PlayerSetupState | null
  canProceedToNextPhase: () => boolean
  getMulliganSelectionCount: () => number
  
  // Reset actions
  resetSetup: () => void
  resetCurrentStep: () => void
}

const initialReikiConfig: ReikiConfiguration = {
  blue: 4,
  red: 4,
  yellow: 4,
  green: 3,
  total: 15
}

const initialMulliganData: MulliganData = {
  selectedCards: [],
  isConfirmed: false
}

export const useGameSetupStore = create<GameSetupStore>((set, get) => ({
  // Initial state
  setupState: null,
  currentPhase: GameSetupPhase.DECK_INPUT,
  myPlayerId: null,
  
  deckInput: '',
  deckValidation: null,
  deckPreview: null,
  reikiConfig: initialReikiConfig,
  mulliganData: initialMulliganData,
  progress: null,
  error: null,
  
  isLoading: false,
  showPreview: false,
  showMulliganConfirm: false,
  timeRemaining: 0,
  
  // Actions
  setSetupState: (state) => set({ setupState: state }),
  
  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  
  // Deck input actions
  setDeckInput: (deckId) => set({ deckInput: deckId }),
  
  setDeckValidation: (result) => set({ deckValidation: result }),
  
  setDeckPreview: (preview) => set({ deckPreview: preview }),
  
  validateDeck: async (deckId: string): Promise<DeckValidationResult> => {
    set({ isLoading: true, error: null })
    
    try {
      // validateDeck関数をインポート
      const { validateDeck } = await import('../utils/deck-utils')
      const result = validateDeck(deckId)
      
      set({ deckValidation: result, isLoading: false })
      return result
      
    } catch (error) {
      const result: DeckValidationResult = {
        isValid: false,
        errors: ['デッキデータの読み込みに失敗しました'],
        cardCount: 0
      }
      set({ deckValidation: result, isLoading: false })
      return result
    }
  },
  
  // REIKI selection actions
  setReikiConfig: (config) => set({ reikiConfig: config }),
  
  updateReikiColor: (color, count) => {
    const { reikiConfig } = get()
    if (color === 'total') return // totalは直接変更不可
    
    const newConfig = { ...reikiConfig, [color]: count }
    newConfig.total = newConfig.blue + newConfig.red + newConfig.yellow + newConfig.green
    
    set({ reikiConfig: newConfig })
  },
  
  canUpdateReikiColor: (color, delta) => {
    const { reikiConfig } = get()
    if (color === 'total') return false
    
    const currentValue = reikiConfig[color]
    const newValue = currentValue + delta
    const newTotal = reikiConfig.total + delta
    
    return newValue >= 0 && newTotal <= 15
  },
  
  // Mulligan actions
  setMulliganData: (data) => set({ mulliganData: data }),
  
  toggleMulliganCard: (index) => {
    const { mulliganData } = get()
    const selectedCards = [...mulliganData.selectedCards]
    const cardIndex = selectedCards.indexOf(index)
    
    if (cardIndex >= 0) {
      selectedCards.splice(cardIndex, 1)
    } else {
      selectedCards.push(index)
    }
    
    set({ 
      mulliganData: { 
        ...mulliganData, 
        selectedCards: selectedCards.sort() 
      } 
    })
  },
  
  confirmMulligan: () => {
    const { mulliganData } = get()
    set({ 
      mulliganData: { 
        ...mulliganData, 
        isConfirmed: true 
      },
      showMulliganConfirm: false
    })
  },
  
  // Progress and error actions
  setProgress: (progress) => set({ progress }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // UI actions
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setShowPreview: (show) => set({ showPreview: show }),
  
  setShowMulliganConfirm: (show) => set({ showMulliganConfirm: show }),
  
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  // Computed properties
  getMySetupState: () => {
    const { setupState, myPlayerId } = get()
    if (!setupState || !myPlayerId) return null
    
    return setupState.player1.playerId === myPlayerId 
      ? setupState.player1 
      : setupState.player2
  },
  
  getOpponentSetupState: () => {
    const { setupState, myPlayerId } = get()
    if (!setupState || !myPlayerId) return null
    
    return setupState.player1.playerId === myPlayerId 
      ? setupState.player2 
      : setupState.player1
  },
  
  canProceedToNextPhase: () => {
    const { currentPhase, deckValidation, reikiConfig, mulliganData } = get()
    
    switch (currentPhase) {
      case GameSetupPhase.DECK_INPUT:
        return deckValidation?.isValid || false
      case GameSetupPhase.REIKI_SELECTION:
        return reikiConfig.total === 15
      case GameSetupPhase.MULLIGAN:
        return mulliganData.isConfirmed
      default:
        return true
    }
  },
  
  getMulliganSelectionCount: () => {
    const { mulliganData } = get()
    return mulliganData.selectedCards.length
  },
  
  // Reset actions
  resetSetup: () => set({
    setupState: null,
    currentPhase: GameSetupPhase.DECK_INPUT,
    deckInput: '',
    deckValidation: null,
    deckPreview: null,
    reikiConfig: initialReikiConfig,
    mulliganData: initialMulliganData,
    progress: null,
    error: null,
    isLoading: false,
    showPreview: false,
    showMulliganConfirm: false,
    timeRemaining: 0
  }),
  
  resetCurrentStep: () => {
    const { currentPhase } = get()
    
    switch (currentPhase) {
      case GameSetupPhase.DECK_INPUT:
        set({ 
          deckInput: '', 
          deckValidation: null, 
          deckPreview: null 
        })
        break
      case GameSetupPhase.REIKI_SELECTION:
        set({ reikiConfig: initialReikiConfig })
        break
      case GameSetupPhase.MULLIGAN:
        set({ mulliganData: initialMulliganData })
        break
    }
    
    set({ error: null, isLoading: false })
  }
}))

export default useGameSetupStore