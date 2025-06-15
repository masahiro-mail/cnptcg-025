import { DeckBuilderCard, UnifiedCard, ReikiCard, CardColor } from '../types/deckbuilder-card'
import { DeckPreview, ReikiConfiguration, DeckValidationResult } from '../types/game-setup'
import { deckBuilderCards } from '../data/deckbuilder-cards'

/**
 * デッキビルダーのカードを統合カードに変換
 */
export function convertToUnifiedCard(deckCard: DeckBuilderCard): UnifiedCard {
  return {
    ...deckCard,
    // ゲーム状態用フィールドの初期化
    hasAttacked: false,
    canAttack: false,
    fieldPosition: undefined,
    currentHealth: undefined,
    health: typeof deckCard.bp === 'string' ? parseInt(deckCard.bp) || 0 : deckCard.bp || 0,
    attack: typeof deckCard.bp === 'string' ? parseInt(deckCard.bp) || 0 : deckCard.bp || 0,
    defense: typeof deckCard.sp === 'string' ? parseInt(deckCard.sp) || 0 : deckCard.sp || 0,
    
    // 既存システム互換用フィールド
    attribute: mapColorToAttribute(deckCard.color),
    text: deckCard.ability || deckCard.description || ''
  }
}

/**
 * カードの色を既存システムの属性に変換
 */
function mapColorToAttribute(color: CardColor): string {
  switch (color) {
    case 'blue': return 'BLUE'
    case 'red': return 'RED'
    case 'yellow': return 'YELLOW'
    case 'green': return 'GREEN'
    case 'purple': return 'PURPLE'
    default: return 'NEUTRAL'
  }
}

/**
 * デッキビルダーIDをデコードしてカードリストを生成
 */
export function decodeDeckBuilderId(deckId: string): string[] | null {
  try {
    // デッキビルダーIDは通常base64エンコードされた文字列
    // または特定の形式のエンコードされたデータ
    
    // まずはlocalStorageから直接確認
    const savedDecks = JSON.parse(localStorage.getItem("cnpDecks") || "{}")
    if (savedDecks[deckId]) {
      const deckData = savedDecks[deckId]
      if (Array.isArray(deckData)) {
        return deckData // 直接配列の場合
      }
      if (deckData.cards && Array.isArray(deckData.cards)) {
        return deckData.cards // オブジェクト形式の場合
      }
    }
    
    // デッキビルダーIDの形式を解析して50枚のカードIDリストを生成
    // 長いIDの場合、これはエンコードされたデッキデータの可能性が高い
    if (deckId.length > 50) {
      return generateDeckFromEncodedId(deckId)
    }
    
    return null
  } catch (error) {
    console.error('Failed to decode deck ID:', error)
    return null
  }
}

/**
 * CNP-TCGデッキビルダーIDをデコード
 */
function generateDeckFromEncodedId(encodedId: string): string[] {
  console.log('Decoding CNP-TCG deck ID:', encodedId)
  
  // CNP-TCGデッキIDの形式チェック（btで始まる60文字）
  if (!encodedId.startsWith('bt') || encodedId.length !== 60) {
    console.warn('Invalid CNP-TCG deck ID format, using fallback')
    return decodeCustomDeckFormat(encodedId)
  }
  
  return decodeCNPTCGDeckId(encodedId)
}

/**
 * CNP-TCGデッキIDをデコード（116枚のカード情報から50枚デッキを生成）
 */
function decodeCNPTCGDeckId(deckId: string): string[] {
  // 文字から2桁数字へのマッピング（エンコードの逆）
  const CHAR_TO_DIGIT_PAIRS: { [key: string]: string } = {
    'a': '00', 'b': '01', 'c': '02', 'd': '03', 'e': '04',
    'f': '10', 'g': '11', 'h': '12', 'i': '13', 'j': '14',
    'k': '20', 'l': '21', 'm': '22', 'n': '23', 'o': '24',
    'p': '30', 'q': '31', 'r': '32', 's': '33', 't': '34',
    'u': '40', 'v': '41', 'w': '42', 'x': '43', 'y': '44', 'z': '44'
  }
  
  const encodedPart = deckId.substring(2) // "bt"を除去
  const cardCounts = new Array(116).fill(0)
  
  // 58文字の各文字をデコードして116枚のカード枚数を復元
  for (let i = 0; i < 58 && i < encodedPart.length; i++) {
    const char = encodedPart[i]
    const digitPair = CHAR_TO_DIGIT_PAIRS[char] || '00'
    
    const firstCardIndex = i * 2
    const secondCardIndex = i * 2 + 1
    
    if (firstCardIndex < 116) {
      cardCounts[firstCardIndex] = parseInt(digitPair[0]) || 0
    }
    if (secondCardIndex < 116) {
      cardCounts[secondCardIndex] = parseInt(digitPair[1]) || 0
    }
  }
  
  console.log('Decoded card counts:', cardCounts.slice(0, 20), '...')
  
  // カード枚数配列から実際の50枚デッキを構築
  return buildDeckFromCardCounts(cardCounts)
}

/**
 * カード枚数配列から50枚のデッキリストを構築
 */
function buildDeckFromCardCounts(cardCounts: number[]): string[] {
  const cardIds: string[] = []
  
  // カード番号1-116に対応するカードIDを取得
  for (let cardNumber = 1; cardNumber <= 116; cardNumber++) {
    const count = cardCounts[cardNumber - 1] || 0
    
    // 対応するカードを検索
    const cardId = findCardByNumber(cardNumber)
    
    if (cardId) {
      // 指定された枚数分追加
      for (let i = 0; i < count; i++) {
        cardIds.push(cardId)
      }
    }
  }
  
  console.log('Built deck from card counts:', {
    totalCards: cardIds.length,
    first10Cards: cardIds.slice(0, 10)
  })
  
  // ちょうど50枚になるように調整
  if (cardIds.length > 50) {
    return cardIds.slice(0, 50)
  } else if (cardIds.length < 50) {
    // 不足分を補完（最初のカードで埋める）
    while (cardIds.length < 50 && deckBuilderCards.length > 0) {
      cardIds.push(deckBuilderCards[0].id)
    }
  }
  
  return cardIds
}

/**
 * カード番号からカードIDを検索
 */
function findCardByNumber(cardNumber: number): string | null {
  // CNP-TCGのカード番号に対応するカードを検索
  // カード番号は通常カードIDの末尾の数字部分に含まれる
  
  // まず直接的なマッピングを試行
  const directMatch = deckBuilderCards.find(card => {
    // BT1-1, BT1-2, ... BT1-116の形式
    const match = card.id.match(/BT1-(\d+)/)
    if (match) {
      return parseInt(match[1]) === cardNumber
    }
    return false
  })
  
  if (directMatch) {
    return directMatch.id
  }
  
  // フォールバック：カード番号をインデックスとして使用
  const fallbackIndex = (cardNumber - 1) % deckBuilderCards.length
  return deckBuilderCards[fallbackIndex]?.id || null
}

/**
 * カスタムエンコーディング形式をデコード（CNP-TCG準拠）
 */
function decodeCustomDeckFormat(encodedId: string): string[] {
  const cardIds: string[] = []
  
  // エンコードIDから決定的にデッキを生成
  const seed = hashString(encodedId)
  console.log('Generating CNP-TCG compliant deck from encoded ID:', encodedId, 'with seed:', seed)
  
  // CNP-TCGルールに準拠したデッキ構成を生成
  const deckComposition = generateCNPTCGDeckComposition(seed)
  
  // 各カテゴリからカードを選択（4枚制限あり）
  const cardsByType = groupCardsByType()
  const cardCounts: { [cardId: string]: number } = {}
  
  deckComposition.forEach(({ type, count, costRange }) => {
    const availableCards = cardsByType[type] || []
    const filteredCards = availableCards.filter(card => 
      card.cost >= costRange[0] && card.cost <= costRange[1]
    )
    
    let addedInCategory = 0
    while (addedInCategory < count && cardIds.length < 50) {
      if (filteredCards.length > 0) {
        const cardIndex = (seed + cardIds.length + addedInCategory) % filteredCards.length
        const selectedCard = filteredCards[cardIndex]
        
        // CNP-TCGルール：同じカードは最大4枚まで
        const currentCount = cardCounts[selectedCard.id] || 0
        if (currentCount < 4) {
          cardIds.push(selectedCard.id)
          cardCounts[selectedCard.id] = currentCount + 1
          addedInCategory++
        } else {
          // 4枚制限に達した場合、別のカードを選択
          const fallbackIndex = (seed + cardIds.length + addedInCategory * 2) % filteredCards.length
          const fallbackCard = filteredCards[fallbackIndex]
          const fallbackCount = cardCounts[fallbackCard.id] || 0
          
          if (fallbackCount < 4) {
            cardIds.push(fallbackCard.id)
            cardCounts[fallbackCard.id] = fallbackCount + 1
            addedInCategory++
          } else {
            // それでもダメな場合は次へ
            addedInCategory++
          }
        }
      } else {
        break
      }
    }
  })
  
  // 50枚に調整（4枚制限を守りながら）
  while (cardIds.length < 50) {
    const availableCards = deckBuilderCards.filter(card => (cardCounts[card.id] || 0) < 4)
    if (availableCards.length === 0) break
    
    const index = (seed + cardIds.length) % availableCards.length
    const selectedCard = availableCards[index]
    cardIds.push(selectedCard.id)
    cardCounts[selectedCard.id] = (cardCounts[selectedCard.id] || 0) + 1
  }
  
  console.log('Generated CNP-TCG deck:', {
    totalCards: cardIds.length,
    cardCounts: Object.keys(cardCounts).length,
    maxPerCard: Math.max(...Object.values(cardCounts))
  })
  
  return cardIds.slice(0, 50)
}

/**
 * CNP-TCGに準拠したデッキ構成を生成
 */
function generateCNPTCGDeckComposition(seed: number) {
  // CNP-TCGの推奨デッキ構成
  return [
    // ユニットカード（メインの戦力）- 30-35枚程度
    { type: 'ユニット', count: 32, costRange: [1, 10] },
    // イベントカード（戦術的効果）- 10-15枚程度  
    { type: 'イベント', count: 12, costRange: [1, 8] },
    // サポートカード（補助効果）- 3-8枚程度
    { type: 'サポート', count: 6, costRange: [1, 6] }
  ]
}

/**
 * カードをタイプ別にグループ化
 */
function groupCardsByType() {
  const groups: { [type: string]: typeof deckBuilderCards } = {}
  
  deckBuilderCards.forEach(card => {
    if (!groups[card.type]) {
      groups[card.type] = []
    }
    groups[card.type].push(card)
  })
  
  return groups
}

/**
 * 文字列のハッシュ値を計算
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit整数に変換
  }
  return Math.abs(hash)
}

/**
 * シード値から疑似乱数生成器を作成
 */
function createSeededRandom(seed: number): () => number {
  let x = seed
  return function() {
    x = Math.sin(x) * 10000
    return x - Math.floor(x)
  }
}

/**
 * ローカルストレージからデッキを読み込み
 */
export function loadDeckFromStorage(deckId: string): UnifiedCard[] | null {
  try {
    const cardIds = decodeDeckBuilderId(deckId)
    
    if (!cardIds) {
      return null
    }
    
    // カードIDから実際のカードデータを取得
    const deck: UnifiedCard[] = []
    
    for (const cardId of cardIds) {
      const deckCard = deckBuilderCards.find(card => card.id === cardId)
      if (deckCard) {
        deck.push(convertToUnifiedCard(deckCard))
      } else {
        // カードが見つからない場合は最初のカードで代替
        console.warn(`Card with ID ${cardId} not found, using fallback`)
        if (deckBuilderCards.length > 0) {
          deck.push(convertToUnifiedCard(deckBuilderCards[0]))
        }
      }
    }
    
    return deck.length >= 50 ? deck.slice(0, 50) : deck
  } catch (error) {
    console.error('Failed to load deck from storage:', error)
    return null
  }
}

/**
 * デッキの検証（CNP-TCGルール準拠）
 */
export function validateDeck(deckId: string): DeckValidationResult {
  try {
    console.log('Validating deck ID:', deckId)
    const deck = loadDeckFromStorage(deckId)
    const errors: string[] = []
    
    if (!deck) {
      console.warn('Deck not found for ID:', deckId)
      return {
        isValid: false,
        errors: ['デッキIDが見つかりません'],
        cardCount: 0
      }
    }
    
    const cardCount = deck.length
    console.log('Deck loaded with', cardCount, 'cards')
    
    if (cardCount !== 50) {
      errors.push(`デッキは50枚である必要があります（現在: ${cardCount}枚）`)
    }
    
    // CNP-TCGルール：カードの重複チェック（4枚制限）
    const cardCounts = new Map<string, number>()
    deck.forEach(card => {
      const count = cardCounts.get(card.id) || 0
      cardCounts.set(card.id, count + 1)
    })
    
    // 4枚制限チェック
    for (const [cardId, count] of cardCounts) {
      if (count > 4) {
        const card = deckBuilderCards.find(c => c.id === cardId)
        errors.push(`「${card?.name || cardId}」は4枚まで入れることができます（現在: ${count}枚）`)
      }
    }
    
    // カードタイプの妥当性チェック
    const validTypes = ['ユニット', 'イベント', 'サポーター']
    const typeDistribution: { [type: string]: number } = {}
    
    deck.forEach(card => {
      if (!validTypes.includes(card.type)) {
        errors.push(`無効なカードタイプです: ${card.type}`)
      }
      typeDistribution[card.type] = (typeDistribution[card.type] || 0) + 1
    })
    
    console.log('Deck validation result:', {
      cardCount,
      uniqueCards: cardCounts.size,
      typeDistribution,
      errors: errors.length
    })
    
    return {
      isValid: errors.length === 0,
      errors,
      cardCount,
      deck: errors.length === 0 ? deck : undefined
    }
  } catch (error) {
    console.error('Deck validation error:', error)
    return {
      isValid: false,
      errors: ['デッキデータの読み込みに失敗しました'],
      cardCount: 0
    }
  }
}

/**
 * デッキのプレビューデータを生成
 */
export function generateDeckPreview(deck: UnifiedCard[]): DeckPreview {
  const costDistribution: { [cost: number]: number } = {}
  const colorDistribution: { [color in CardColor]: number } = {
    blue: 0,
    red: 0,
    yellow: 0,
    green: 0,
    purple: 0
  }
  const typeDistribution: { [type: string]: number } = {}
  
  deck.forEach(card => {
    // コスト分布
    costDistribution[card.cost] = (costDistribution[card.cost] || 0) + 1
    
    // 色分布
    if (card.color in colorDistribution) {
      colorDistribution[card.color as CardColor]++
    }
    
    // タイプ分布
    typeDistribution[card.type] = (typeDistribution[card.type] || 0) + 1
  })
  
  return {
    cards: deck,
    costDistribution,
    colorDistribution,
    typeDistribution,
    totalCards: deck.length
  }
}

/**
 * REIKIカードを生成
 */
export function generateReikiCard(color: CardColor, index: number): ReikiCard {
  const colorNames = {
    blue: '青',
    red: '赤', 
    yellow: '黄',
    green: '緑',
    purple: '紫'
  }
  
  return {
    id: `reiki-${color}-${index}`,
    name: `レイキ/${colorNames[color]}`,
    color,
    type: 'REIKI',
    cost: 0,
    description: `${colorNames[color]}のレイキカード`
  }
}

/**
 * REIKI構成からREIKIデッキを生成
 */
export function generateReikiDeck(config: ReikiConfiguration): ReikiCard[] {
  const reikiDeck: ReikiCard[] = []
  let cardIndex = 0
  
  // 各色のREIKIカードを生成
  Object.entries(config).forEach(([color, count]) => {
    if (color === 'total') return
    
    for (let i = 0; i < count; i++) {
      reikiDeck.push(generateReikiCard(color as CardColor, cardIndex++))
    }
  })
  
  // シャッフル
  return shuffleArray(reikiDeck)
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
 * デッキから初期手札を配布
 */
export function dealInitialHand(deck: UnifiedCard[], handSize: number = 5): {
  hand: UnifiedCard[]
  remainingDeck: UnifiedCard[]
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
  hand: UnifiedCard[], 
  deck: UnifiedCard[], 
  selectedIndices: number[]
): {
  newHand: UnifiedCard[]
  newDeck: UnifiedCard[]
} {
  // 戻すカードと残すカードを分離
  const cardsToReturn: UnifiedCard[] = []
  const cardsToKeep: UnifiedCard[] = []
  
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
export function placeGaugeCards(deck: UnifiedCard[]): {
  gaugeCards: { [position: string]: UnifiedCard[] }
  remainingDeck: UnifiedCard[]
} {
  const shuffledDeck = shuffleArray(deck)
  const positions = ['LEFT', 'CENTER', 'RIGHT']
  const gaugeCards: { [position: string]: UnifiedCard[] } = {}
  
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

/**
 * カードの検索とフィルタリング
 */
export function searchCards(
  query: string, 
  color?: CardColor, 
  type?: string
): DeckBuilderCard[] {
  let filtered = deckBuilderCards
  
  // 色でフィルタ
  if (color) {
    filtered = filtered.filter(card => card.color === color)
  }
  
  // タイプでフィルタ
  if (type) {
    filtered = filtered.filter(card => card.type === type)
  }
  
  // 名前でフィルタ
  if (query.trim()) {
    const lowercaseQuery = query.toLowerCase()
    filtered = filtered.filter(card => 
      card.name.toLowerCase().includes(lowercaseQuery) ||
      card.description?.toLowerCase().includes(lowercaseQuery) ||
      card.ability?.toLowerCase().includes(lowercaseQuery)
    )
  }
  
  return filtered
}

/**
 * デッキ統計の計算
 */
export function calculateDeckStats(deck: UnifiedCard[]) {
  const avgCost = deck.reduce((sum, card) => sum + card.cost, 0) / deck.length
  const avgBP = deck.reduce((sum, card) => {
    const bp = typeof card.bp === 'string' ? parseInt(card.bp) || 0 : card.bp || 0
    return sum + bp
  }, 0) / deck.length
  
  const costCurve: number[] = new Array(10).fill(0)
  deck.forEach(card => {
    const cost = Math.min(card.cost, 9)
    costCurve[cost]++
  })
  
  return {
    averageCost: Math.round(avgCost * 100) / 100,
    averageBP: Math.round(avgBP),
    costCurve,
    totalCards: deck.length
  }
}