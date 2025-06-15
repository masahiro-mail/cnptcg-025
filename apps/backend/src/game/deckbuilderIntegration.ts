import { 
  Card, 
  CardType, 
  Attribute, 
  Phase, 
  FieldPosition 
} from '@cnp-tcg/common-types';

import { GameState, Player } from './gameLogic';

// デッキビルダー統合用の型定義
export interface DeckBuilderCard {
  id: string
  name: string
  type: 'ユニット' | 'イベント' | 'サポーター'
  cost: number
  bp?: string | number
  sp?: string | number
  ability?: string
  description?: string
  faction?: string
  illustrator?: string
  imageUrl?: string
  color: 'blue' | 'red' | 'yellow' | 'green' | 'purple'
  rarity?: string
  cardNumber?: string
  colorBalance?: string
  colorCost?: number
  colorlessCost?: number
  effectType?: string[]
  pack?: string
}

export interface ReikiConfiguration {
  blue: number
  red: number
  yellow: number
  green: number
  total: number
}

export interface GameSetupData {
  player1: PlayerSetupData
  player2: PlayerSetupData
  phase: 'deck_input' | 'reiki_selection' | 'turn_order' | 'initial_hand' | 'mulligan' | 'gauge_placement' | 'game_ready'
  firstPlayerId: string | null
}

export interface PlayerSetupData {
  playerId: string
  playerName: string
  deckId?: string
  deck?: Card[]
  reikiConfig?: ReikiConfiguration
  isReady: boolean
  initialHand?: Card[]
  mulliganSelection?: number[]
  finalHand?: Card[]
  gaugeCards?: Card[]
  remainingDeck?: Card[]
}

export interface DeckValidationResult {
  isValid: boolean
  errors: string[]
  cardCount: number
}

/**
 * デッキビルダーのカードを共通型に変換
 */
export function convertDeckBuilderCard(deckCard: DeckBuilderCard): Card {
  return {
    id: deckCard.id,
    name: deckCard.name,
    type: mapDeckBuilderType(deckCard.type),
    cost: deckCard.cost,
    attribute: mapColorToAttribute(deckCard.color),
    text: deckCard.ability || deckCard.description || '',
    bp: typeof deckCard.bp === 'string' ? parseInt(deckCard.bp) || 0 : deckCard.bp || 0,
    sp: typeof deckCard.sp === 'string' ? parseInt(deckCard.sp) || 0 : deckCard.sp || 0,
    attack: typeof deckCard.bp === 'string' ? parseInt(deckCard.bp) || 0 : deckCard.bp || 0,
    defense: typeof deckCard.sp === 'string' ? parseInt(deckCard.sp) || 0 : deckCard.sp || 0,
    health: typeof deckCard.bp === 'string' ? parseInt(deckCard.bp) || 0 : deckCard.bp || 0,
    hasAttacked: false,
    canAttack: false,
    fieldPosition: undefined,
    currentHealth: undefined
  }
}

/**
 * デッキビルダーのタイプを共通型に変換
 */
function mapDeckBuilderType(type: 'ユニット' | 'イベント' | 'サポーター'): CardType {
  switch (type) {
    case 'ユニット': return CardType.UNIT
    case 'イベント': return CardType.EVENT
    case 'サポーター': return CardType.SUPPORTER
    default: return CardType.UNIT
  }
}

/**
 * カードの色を属性に変換
 */
function mapColorToAttribute(color: string): Attribute {
  switch (color) {
    case 'blue': return Attribute.BLUE
    case 'red': return Attribute.RED
    case 'yellow': return Attribute.YELLOW
    case 'green': return Attribute.GREEN
    case 'purple': return Attribute.REIKI // Map purple to REIKI as fallback
    default: return Attribute.REIKI // Use REIKI as default instead of NEUTRAL
  }
}

/**
 * REIKIカードを生成
 */
export function generateReikiCard(color: string, index: number): Card {
  const colorNames = {
    blue: '青',
    red: '赤',
    yellow: '黄',
    green: '緑'
  }
  
  return {
    id: `reiki-${color}-${index}`,
    name: `レイキ/${colorNames[color as keyof typeof colorNames] || color}`,
    type: CardType.EVENT, // REIKI cards are treated as special events
    cost: 0,
    attribute: Attribute.REIKI, // Use REIKI attribute for REIKI cards
    text: `${colorNames[color as keyof typeof colorNames] || color}のレイキカード`,
    bp: 0,
    sp: 0,
    attack: 0,
    defense: 0,
    health: 0,
    hasAttacked: false,
    canAttack: false
  }
}

/**
 * REIKI構成からREIKIデッキを生成
 */
export function generateReikiDeck(config: ReikiConfiguration): Card[] {
  const reikiDeck: Card[] = []
  let cardIndex = 0
  
  // 各色のREIKIカードを生成
  Object.entries(config).forEach(([color, count]) => {
    if (color === 'total') return
    
    for (let i = 0; i < count; i++) {
      reikiDeck.push(generateReikiCard(color, cardIndex++))
    }
  })
  
  return shuffleArray(reikiDeck)
}

/**
 * デッキの検証（CNP-TCGルール準拠）
 */
export function validateDeck(cards: DeckBuilderCard[]): DeckValidationResult {
  const errors: string[] = []
  
  // カード数チェック（50枚）
  if (cards.length !== 50) {
    errors.push(`デッキは50枚である必要があります（現在: ${cards.length}枚）`)
  }
  
  // カードの重複チェック（4枚制限）
  const cardCounts = new Map<string, number>()
  cards.forEach(card => {
    const count = cardCounts.get(card.id) || 0
    cardCounts.set(card.id, count + 1)
  })
  
  // 4枚制限チェック
  for (const [cardId, count] of cardCounts) {
    if (count > 4) {
      const card = cards.find(c => c.id === cardId)
      errors.push(`「${card?.name || cardId}」は4枚まで入れることができます（現在: ${count}枚）`)
    }
  }
  
  // カードタイプの妥当性チェック
  const validTypes = ['ユニット', 'イベント', 'サポーター']
  cards.forEach(card => {
    if (!validTypes.includes(card.type)) {
      errors.push(`無効なカードタイプです: ${card.type}`)
    }
  })
  
  // 基本的なカード情報の検証
  cards.forEach(card => {
    if (!card.id || !card.name) {
      errors.push('カード情報が不完全です')
    }
    if (typeof card.cost !== 'number' || card.cost < 0) {
      errors.push(`「${card.name}」のコストが無効です`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    cardCount: cards.length
  }
}

/**
 * 配列をシャッフル
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 初期手札を配布
 */
export function dealInitialHand(deck: Card[], handSize: number = 5): {
  hand: Card[]
  remainingDeck: Card[]
} {
  const shuffledDeck = shuffleArray(deck)
  const hand = shuffledDeck.slice(0, handSize)
  const remainingDeck = shuffledDeck.slice(handSize)
  
  return { hand, remainingDeck }
}

/**
 * マリガン処理
 */
export function processMulligan(
  hand: Card[], 
  deck: Card[], 
  selectedIndices: number[]
): {
  newHand: Card[]
  newDeck: Card[]
} {
  // 戻すカードと残すカードを分離
  const cardsToReturn: Card[] = []
  const cardsToKeep: Card[] = []
  
  hand.forEach((card, index) => {
    if (selectedIndices.includes(index)) {
      cardsToReturn.push(card)
    } else {
      cardsToKeep.push(card)
    }
  })
  
  // 戻したカードをデッキに混ぜてシャッフル
  const newDeck = shuffleArray([...deck, ...cardsToReturn])
  
  // 新しいカードをドロー
  const cardsToDraw = selectedIndices.length
  const drawnCards = newDeck.slice(0, cardsToDraw)
  const finalDeck = newDeck.slice(cardsToDraw)
  
  const newHand = [...cardsToKeep, ...drawnCards]
  
  return {
    newHand,
    newDeck: finalDeck
  }
}

/**
 * ガードカードの配置（2枚×3拠点）
 */
export function placeGaugeCards(deck: Card[]): {
  gaugeCards: { [position: string]: Card[] }
  remainingDeck: Card[]
} {
  const shuffledDeck = shuffleArray(deck)
  const positions = ['LEFT', 'CENTER', 'RIGHT']
  const gaugeCards: { [position: string]: Card[] } = {}
  
  let cardIndex = 0
  positions.forEach(position => {
    gaugeCards[position] = [
      shuffledDeck[cardIndex++],
      shuffledDeck[cardIndex++]
    ]
  })
  
  const remainingDeck = shuffledDeck.slice(cardIndex)
  
  return {
    gaugeCards,
    remainingDeck
  }
}

/**
 * ゲームセットアップデータから通常のゲーム状態を作成
 */
export function createGameStateFromSetup(setupData: GameSetupData): GameState {
  const { player1, player2 } = setupData
  
  // プレイヤー情報を作成
  const player1State: Player = createPlayerFromSetup(player1, setupData.firstPlayerId === player1.playerId)
  const player2State: Player = createPlayerFromSetup(player2, setupData.firstPlayerId === player2.playerId)
  
  return {
    id: `game-${Date.now()}`,
    roomId: '', // ルームマネージャーで設定
    players: [player1State, player2State],
    currentTurn: setupData.firstPlayerId === player1.playerId ? 0 : 1,
    currentPlayer: setupData.firstPlayerId === player1.playerId ? 'player1' : 'player2',
    turnCount: 1,
    turn: 1,
    phase: Phase.DRAW,
    winner: null,
    startTime: Date.now()
  }
}

/**
 * セットアップデータからプレイヤーを作成
 */
function createPlayerFromSetup(setupData: PlayerSetupData, isFirstPlayer: boolean): Player {
  const reikiConfig = setupData.reikiConfig || { blue: 4, red: 4, yellow: 4, green: 3, total: 15 }
  
  return {
    id: setupData.playerId,
    name: setupData.playerName,
    hand: setupData.finalHand || [],
    deck: setupData.remainingDeck || [],
    field: [],
    fieldMap: {
      [FieldPosition.LEFT]: null,
      [FieldPosition.CENTER]: null,
      [FieldPosition.RIGHT]: null
    },
    unitArea: [],
    supporterZone: [],
    trash: [],
    graveyard: [],
    reikiZone: [],
    reikiDeck: generateReikiDeck(reikiConfig),
    reikiCounts: {
      red: reikiConfig.red,
      blue: reikiConfig.blue,
      yellow: reikiConfig.yellow,
      green: reikiConfig.green
    },
    usedReiki: {
      red: 0,
      blue: 0,
      yellow: 0,
      green: 0
    },
    mana: 0,
    maxMana: 0,
    gauges: {
      [FieldPosition.LEFT]: 2,
      [FieldPosition.CENTER]: 2,
      [FieldPosition.RIGHT]: 2
    },
    bases: {
      [FieldPosition.LEFT]: {
        position: FieldPosition.LEFT,
        health: 2,
        maxHealth: 2,
        isDestroyed: false,
        gaugeCards: setupData.gaugeCards?.slice(0, 2) || []
      },
      [FieldPosition.CENTER]: {
        position: FieldPosition.CENTER,
        health: 2,
        maxHealth: 2,
        isDestroyed: false,
        gaugeCards: setupData.gaugeCards?.slice(2, 4) || []
      },
      [FieldPosition.RIGHT]: {
        position: FieldPosition.RIGHT,
        health: 2,
        maxHealth: 2,
        isDestroyed: false,
        gaugeCards: setupData.gaugeCards?.slice(4, 6) || []
      }
    }
  }
}


/**
 * REIKI構成の検証
 */
export function validateReikiConfiguration(config: ReikiConfiguration): boolean {
  const { blue, red, yellow, green, total } = config
  
  // 各色が0以上であることを確認
  if (blue < 0 || red < 0 || yellow < 0 || green < 0) {
    return false
  }
  
  // 合計が15であることを確認
  const calculatedTotal = blue + red + yellow + green
  return calculatedTotal === 15 && total === 15
}