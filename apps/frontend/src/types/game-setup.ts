import { DeckBuilderCard, UnifiedCard, ReikiCard, CardColor } from './deckbuilder-card'

// ゲームセットアップの段階定義
export enum GameSetupPhase {
  DECK_INPUT = 'deck_input',
  REIKI_SELECTION = 'reiki_selection', 
  TURN_ORDER_DECISION = 'turn_order_decision',
  INITIAL_HAND = 'initial_hand',
  MULLIGAN = 'mulligan',
  GAUGE_PLACEMENT = 'gauge_placement',
  GAME_START = 'game_start'
}

// プレイヤーのセットアップ状態
export interface PlayerSetupState {
  playerId: string
  playerName: string
  deckId?: string
  deck?: UnifiedCard[]
  reikiConfig?: ReikiConfiguration
  isReady: boolean
  isFirstPlayer?: boolean
  initialHand?: UnifiedCard[]
  mulliganSelection?: number[] // インデックスの配列
  finalHand?: UnifiedCard[]
  gaugeCards?: UnifiedCard[]
  remainingDeck?: UnifiedCard[]
}

// REIKIカード構成
export interface ReikiConfiguration {
  blue: number
  red: number
  yellow: number
  green: number
  total: number
}

// ゲームセットアップ全体の状態
export interface GameSetupState {
  phase: GameSetupPhase
  player1: PlayerSetupState
  player2: PlayerSetupState
  currentStep: string
  timeoutAt?: number // タイムアウト時刻
  errorMessage?: string
}

// デッキ検証結果
export interface DeckValidationResult {
  isValid: boolean
  errors: string[]
  cardCount: number
  deck?: UnifiedCard[]
}

// マリガン関連の型
export interface MulliganData {
  selectedCards: number[] // 手札のインデックス
  isConfirmed: boolean
}

// プログレス表示用の型
export interface SetupProgress {
  currentPlayer: string
  waitingFor: string
  message: string
  timeRemaining?: number
}

// Socket通信用のイベント型
export interface SetupSocketEvents {
  // クライアント -> サーバー
  'setup-deck-input': {
    playerId: string
    deckId: string
  }
  
  'setup-reiki-selection': {
    playerId: string
    reikiConfig: ReikiConfiguration
  }
  
  'setup-mulligan-selection': {
    playerId: string
    selectedCards: number[]
  }
  
  'setup-ready': {
    playerId: string
  }
  
  // サーバー -> クライアント
  'setup-phase-update': {
    setupState: GameSetupState
  }
  
  'setup-deck-validation': {
    playerId: string
    result: DeckValidationResult
  }
  
  'setup-turn-order-decided': {
    player1Id: string
    player2Id: string
    firstPlayerId: string
  }
  
  'setup-initial-hand-dealt': {
    playerId: string
    hand: UnifiedCard[]
  }
  
  'setup-mulligan-complete': {
    playerId: string
    newHand: UnifiedCard[]
    remainingDeck: UnifiedCard[]
  }
  
  'setup-gauge-placed': {
    player1Gauge: UnifiedCard[]
    player2Gauge: UnifiedCard[]
  }
  
  'setup-game-ready': {
    gameState: any // 実際のゲーム状態
  }
  
  'setup-error': {
    playerId?: string
    error: string
  }
  
  'setup-timeout-warning': {
    timeRemaining: number
  }
  
  'setup-timeout': {
    phase: GameSetupPhase
  }
}

// REIKIデッキ生成用のヘルパー型
export interface ReikiDeckGenerator {
  generateReikiDeck: (config: ReikiConfiguration) => ReikiCard[]
  validateReikiConfig: (config: ReikiConfiguration) => boolean
}

// デッキプレビュー用の型
export interface DeckPreview {
  cards: UnifiedCard[]
  costDistribution: { [cost: number]: number }
  colorDistribution: { [color in CardColor]: number }
  typeDistribution: { [type: string]: number }
  totalCards: number
}

// エラーハンドリング用の型
export interface SetupError {
  type: 'validation' | 'timeout' | 'network' | 'system'
  message: string
  phase: GameSetupPhase
  playerId?: string
  retryable: boolean
}