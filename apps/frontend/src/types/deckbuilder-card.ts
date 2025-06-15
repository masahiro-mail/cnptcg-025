export interface DeckBuilderCard {
  id: string
  name: string
  type: CardType
  rarity: CardRarity
  color: CardColor
  cost: number
  bp?: string | number
  sp?: string | number // 助太刀ポイント
  ability?: string
  description?: string
  faction?: string
  illustrator?: string
  imageUrl?: string
  cardNumber?: string
  colorBalance?: string
  colorCost?: number
  colorlessCost?: number
  effectType?: string[]
  pack?: string
}

export type CardType = "ユニット" | "イベント" | "サポーター"
export type CardRarity = "C" | "R" | "RR" | "RRR" | "SR" | "P" | "P-RR" | "SP-RRR"
export type CardColor = "blue" | "red" | "yellow" | "green" | "purple"

// 既存のCard型とDeckBuilderCard型を統合する型
export interface UnifiedCard extends DeckBuilderCard {
  // ゲーム中の状態管理用フィールド
  hasAttacked?: boolean
  canAttack?: boolean
  fieldPosition?: string
  currentHealth?: number
  health?: number
  attack?: number
  defense?: number
  
  // 既存システムとの互換性用フィールド
  attribute?: string
  text?: string
}

// REIKIカード用の型
export interface ReikiCard {
  id: string
  name: string
  color: CardColor
  type: "REIKI"
  cost: 0
  description: string
}

// デッキ構成用の型
export interface DeckConfiguration {
  id: string
  name: string
  cards: string[] // カードIDの配列
  reikiConfig: {
    blue: number
    red: number
    yellow: number
    green: number
  }
  createdAt: string
  updatedAt: string
}

// ゲームセットアップ用の型
export interface GameSetupData {
  deckId: string
  deck: UnifiedCard[]
  reikiDeck: ReikiCard[]
  initialHand: UnifiedCard[]
  gaugeCards: UnifiedCard[]
  remainingDeck: UnifiedCard[]
  playerColor: CardColor
  isFirstPlayer: boolean
}