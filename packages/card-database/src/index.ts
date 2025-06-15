import { Card, CardType, Attribute, DeckValidationResult } from '@cnp-tcg/common-types';

// CNP-TCG カードデータベース
export const cards: Card[] = [
  // Blue cards (cnp-001 to cnp-012): Draw/Return effects
  {
    id: 'cnp-001',
    name: 'ブルーウェーブ',
    type: CardType.EVENT,
    attribute: Attribute.BLUE,
    cost: 2,
    text: 'カードを2枚ドローする。',
  },
  {
    id: 'cnp-002',
    name: '水の精霊',
    type: CardType.UNIT,
    attribute: Attribute.BLUE,
    cost: 3,
    attack: 2,
    defense: 3,
    text: '登場時：カードを1枚ドローする。',
  },
  {
    id: 'cnp-003',
    name: '海の守護者',
    type: CardType.UNIT,
    attribute: Attribute.BLUE,
    cost: 5,
    attack: 4,
    defense: 5,
    text: '対戦相手のユニット1体を手札に戻す。',
  },
  {
    id: 'cnp-004',
    name: '知恵の泉',
    type: CardType.EVENT,
    attribute: Attribute.BLUE,
    cost: 4,
    text: 'カードを3枚ドローし、その後手札を1枚捨てる。',
  },
  {
    id: 'cnp-005',
    name: '青い賢者',
    type: CardType.SUPPORTER,
    attribute: Attribute.BLUE,
    cost: 3,
    text: '毎ターン開始時、カードを1枚ドローする。',
  },
  {
    id: 'cnp-006',
    name: '潮流の舞踏家',
    type: CardType.UNIT,
    attribute: Attribute.BLUE,
    cost: 2,
    attack: 1,
    defense: 2,
    text: '登場時：ユニット1体を手札に戻す。',
  },
  {
    id: 'cnp-007',
    name: '深海の探求者',
    type: CardType.UNIT,
    attribute: Attribute.BLUE,
    cost: 4,
    attack: 3,
    defense: 3,
    text: '攻撃時：カードを1枚ドローする。',
  },
  {
    id: 'cnp-008',
    name: '瞬間移動',
    type: CardType.EVENT,
    attribute: Attribute.BLUE,
    cost: 1,
    text: '自分のユニット1体を手札に戻す。',
  },
  {
    id: 'cnp-009',
    name: '水晶の占い師',
    type: CardType.UNIT,
    attribute: Attribute.BLUE,
    cost: 3,
    attack: 2,
    defense: 2,
    text: 'デッキの上から3枚を見て、1枚を手札に加え、残りをデッキの下に置く。',
  },
  {
    id: 'cnp-010',
    name: '記憶の消去',
    type: CardType.EVENT,
    attribute: Attribute.BLUE,
    cost: 2,
    text: '対戦相手の手札を1枚ランダムに捨てる。',
  },
  {
    id: 'cnp-011',
    name: '波の騎士',
    type: CardType.UNIT,
    attribute: Attribute.BLUE,
    cost: 6,
    attack: 5,
    defense: 4,
    text: '登場時：対戦相手のユニットを全て手札に戻す。',
  },
  {
    id: 'cnp-012',
    name: '海流の導き',
    type: CardType.EVENT,
    attribute: Attribute.BLUE,
    cost: 3,
    text: 'デッキから青属性のカードを1枚探して手札に加える。',
  },

  // Red cards (cnp-013 to cnp-024): High damage effects
  {
    id: 'cnp-013',
    name: '炎の戦士',
    type: CardType.UNIT,
    attribute: Attribute.RED,
    cost: 4,
    attack: 5,
    defense: 3,
    text: '登場時：対戦相手のユニット1体に3ダメージを与える。',
  },
  {
    id: 'cnp-014',
    name: 'ファイアボール',
    type: CardType.EVENT,
    attribute: Attribute.RED,
    cost: 3,
    text: '対戦相手のユニット1体に4ダメージを与える。',
  },
  {
    id: 'cnp-015',
    name: '激情の炎',
    type: CardType.SUPPORTER,
    attribute: Attribute.RED,
    cost: 4,
    text: '自分の赤属性ユニットの攻撃力を+2する。',
  },
  {
    id: 'cnp-016',
    name: '紅蓮の騎士',
    type: CardType.UNIT,
    attribute: Attribute.RED,
    cost: 5,
    attack: 6,
    defense: 4,
    text: '速攻（このユニットは登場ターンに攻撃できる）',
  },
  {
    id: 'cnp-017',
    name: '爆発の術',
    type: CardType.EVENT,
    attribute: Attribute.RED,
    cost: 5,
    text: '全ての敵ユニットに2ダメージを与える。',
  },
  {
    id: 'cnp-018',
    name: '火山の守護者',
    type: CardType.UNIT,
    attribute: Attribute.RED,
    cost: 6,
    attack: 7,
    defense: 5,
    text: '登場時：全ての敵ユニットに1ダメージを与える。',
  },
  {
    id: 'cnp-019',
    name: '炎の矢',
    type: CardType.EVENT,
    attribute: Attribute.RED,
    cost: 1,
    text: '対戦相手のユニット1体に2ダメージを与える。',
  },
  {
    id: 'cnp-020',
    name: '業火の魔術師',
    type: CardType.UNIT,
    attribute: Attribute.RED,
    cost: 3,
    attack: 3,
    defense: 2,
    text: 'ターン終了時：ランダムな敵ユニット1体に1ダメージを与える。',
  },
  {
    id: 'cnp-021',
    name: '焼却',
    type: CardType.EVENT,
    attribute: Attribute.RED,
    cost: 2,
    text: 'ユニット1体を破壊する。そのユニットの攻撃力が3以下の場合。',
  },
  {
    id: 'cnp-022',
    name: '怒りの戦士',
    type: CardType.UNIT,
    attribute: Attribute.RED,
    cost: 2,
    attack: 3,
    defense: 1,
    text: '速攻',
  },
  {
    id: 'cnp-023',
    name: '灼熱の大地',
    type: CardType.EVENT,
    attribute: Attribute.RED,
    cost: 4,
    text: '3ターンの間、ターン開始時に全ての敵ユニットに1ダメージを与える。',
  },
  {
    id: 'cnp-024',
    name: '炎の支配者',
    type: CardType.UNIT,
    attribute: Attribute.RED,
    cost: 7,
    attack: 8,
    defense: 6,
    text: '登場時：対戦相手のユニット1体を破壊する。',
  },

  // Yellow cards (cnp-025 to cnp-035): Hand manipulation/Cost reduction
  {
    id: 'cnp-025',
    name: '光の祝福',
    type: CardType.EVENT,
    attribute: Attribute.YELLOW,
    cost: 2,
    text: '次に使用するカードのコストを2減らす。',
  },
  {
    id: 'cnp-026',
    name: '太陽の司祭',
    type: CardType.UNIT,
    attribute: Attribute.YELLOW,
    cost: 3,
    attack: 2,
    defense: 3,
    text: '自分のターン開始時、手札が3枚以下ならカードを1枚ドローする。',
  },
  {
    id: 'cnp-027',
    name: '黄金の護符',
    type: CardType.SUPPORTER,
    attribute: Attribute.YELLOW,
    cost: 2,
    text: '自分の黄属性カードのコストを1減らす。',
  },
  {
    id: 'cnp-028',
    name: '光の戦士',
    type: CardType.UNIT,
    attribute: Attribute.YELLOW,
    cost: 4,
    attack: 3,
    defense: 4,
    text: '登場時：手札を全て捨て、その枚数分カードをドローする。',
  },
  {
    id: 'cnp-029',
    name: '聖なる儀式',
    type: CardType.EVENT,
    attribute: Attribute.YELLOW,
    cost: 3,
    text: '手札を2枚捨て、カードを3枚ドローする。',
  },
  {
    id: 'cnp-030',
    name: '輝きの天使',
    type: CardType.UNIT,
    attribute: Attribute.YELLOW,
    cost: 5,
    attack: 4,
    defense: 4,
    text: '登場時：このターン、次に使用するカードのコストを3減らす。',
  },
  {
    id: 'cnp-031',
    name: '節約の術',
    type: CardType.EVENT,
    attribute: Attribute.YELLOW,
    cost: 1,
    text: 'このターン、カードを1枚使用するたびに1ゲージ回復する。',
  },
  {
    id: 'cnp-032',
    name: '黄金の商人',
    type: CardType.UNIT,
    attribute: Attribute.YELLOW,
    cost: 2,
    attack: 1,
    defense: 3,
    text: '登場時：1ゲージ回復する。',
  },
  {
    id: 'cnp-033',
    name: '光の加護',
    type: CardType.EVENT,
    attribute: Attribute.YELLOW,
    cost: 0,
    text: '自分のユニット1体の防御力を+2する。',
  },
  {
    id: 'cnp-034',
    name: '太陽の賢者',
    type: CardType.UNIT,
    attribute: Attribute.YELLOW,
    cost: 6,
    attack: 5,
    defense: 5,
    text: '登場時：手札のカードを全て3コスト減らす（最低1）。',
  },
  {
    id: 'cnp-035',
    name: '希望の光',
    type: CardType.EVENT,
    attribute: Attribute.YELLOW,
    cost: 4,
    text: 'デッキから好きなカードを2枚探して手札に加える。',
  },

  // Green cards (cnp-036 to cnp-046): Movement/Gauge manipulation
  {
    id: 'cnp-036',
    name: '自然の恵み',
    type: CardType.EVENT,
    attribute: Attribute.GREEN,
    cost: 2,
    text: '2ゲージ回復する。',
  },
  {
    id: 'cnp-037',
    name: '森の守護者',
    type: CardType.UNIT,
    attribute: Attribute.GREEN,
    cost: 4,
    attack: 3,
    defense: 5,
    text: '自分のターン開始時、1ゲージ回復する。',
  },
  {
    id: 'cnp-038',
    name: '大地の力',
    type: CardType.SUPPORTER,
    attribute: Attribute.GREEN,
    cost: 3,
    text: '毎ターン、最大ゲージが1増える。',
  },
  {
    id: 'cnp-039',
    name: '風の舞踏家',
    type: CardType.UNIT,
    attribute: Attribute.GREEN,
    cost: 3,
    attack: 2,
    defense: 2,
    text: '登場時：自分のユニット1体を別の場所に移動する。',
  },
  {
    id: 'cnp-040',
    name: '成長の種',
    type: CardType.EVENT,
    attribute: Attribute.GREEN,
    cost: 1,
    text: '自分のユニット1体の攻撃力と防御力を+1/+1する。',
  },
  {
    id: 'cnp-041',
    name: '森の賢者',
    type: CardType.UNIT,
    attribute: Attribute.GREEN,
    cost: 5,
    attack: 4,
    defense: 6,
    text: '登場時：3ゲージ回復する。',
  },
  {
    id: 'cnp-042',
    name: '自然の怒り',
    type: CardType.EVENT,
    attribute: Attribute.GREEN,
    cost: 4,
    text: '自分のユニット全てに+2/+2を与える。',
  },
  {
    id: 'cnp-043',
    name: '樹木の精霊',
    type: CardType.UNIT,
    attribute: Attribute.GREEN,
    cost: 2,
    attack: 1,
    defense: 4,
    text: '防御力が攻撃力より高い間、このユニットは破壊されない。',
  },
  {
    id: 'cnp-044',
    name: '再生の泉',
    type: CardType.EVENT,
    attribute: Attribute.GREEN,
    cost: 3,
    text: '破壊された自分のユニット1体を場に戻す。',
  },
  {
    id: 'cnp-045',
    name: '大樹の守護者',
    type: CardType.UNIT,
    attribute: Attribute.GREEN,
    cost: 6,
    attack: 5,
    defense: 7,
    text: '他の自分のユニットが破壊されるとき、代わりにこのユニットに1ダメージを与える。',
  },
  {
    id: 'cnp-046',
    name: '豊穣の祭り',
    type: CardType.EVENT,
    attribute: Attribute.GREEN,
    cost: 5,
    text: '最大ゲージを3増やし、3ゲージ回復する。',
  },

  // Reiki cards (cnp-047 to cnp-050): Multi-color combinations
  {
    id: 'cnp-047',
    name: '霊気の覚醒',
    type: CardType.EVENT,
    attribute: Attribute.REIKI,
    cost: 6,
    text: 'カードを3枚ドローし、3ゲージ回復する。全ての敵ユニットに2ダメージを与える。',
  },
  {
    id: 'cnp-048',
    name: '霊気の守護神',
    type: CardType.UNIT,
    attribute: Attribute.REIKI,
    cost: 8,
    attack: 7,
    defense: 7,
    text: '登場時：各属性の効果を1つずつ発動する。青：カード2枚ドロー、赤：敵全体に2ダメージ、黄：コスト3減少、緑：3ゲージ回復。',
  },
  {
    id: 'cnp-049',
    name: '霊気の賢者',
    type: CardType.SUPPORTER,
    attribute: Attribute.REIKI,
    cost: 5,
    text: '自分のカードは全ての属性として扱われる。',
  },
  {
    id: 'cnp-050',
    name: '完全なる調和',
    type: CardType.EVENT,
    attribute: Attribute.REIKI,
    cost: 10,
    text: '手札を全て捨て、各属性のカードを2枚ずつドローする。このターン、カードのコストは0になる。',
  },
];

// Helper functions
export function getCardById(id: string): Card | undefined {
  return cards.find(card => card.id === id);
}

export function getCardsByType(type: CardType): Card[] {
  return cards.filter(card => card.type === type);
}

export function getCardsByAttribute(attribute: Attribute): Card[] {
  return cards.filter(card => card.attribute === attribute);
}

// Deck validation function
export function validateDeck(deckCardIds: string[]): DeckValidationResult {
  const errors: string[] = [];
  
  // Check deck size
  if (deckCardIds.length !== 40) {
    errors.push(`デッキは40枚である必要があります。現在: ${deckCardIds.length}枚`);
  }
  
  // Check card limits (max 3 copies per card)
  const cardCounts = new Map<string, number>();
  for (const cardId of deckCardIds) {
    const count = (cardCounts.get(cardId) || 0) + 1;
    cardCounts.set(cardId, count);
    
    if (count > 3) {
      const card = getCardById(cardId);
      errors.push(`「${card?.name || cardId}」は3枚を超えて入れることはできません。`);
    }
  }
  
  // Check if all cards exist
  for (const cardId of deckCardIds) {
    if (!getCardById(cardId)) {
      errors.push(`カードID「${cardId}」は存在しません。`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Starter deck creation functions
export function createStarterDeck(attribute: Attribute): string[] {
  const deck: string[] = [];
  const attributeCards = getCardsByAttribute(attribute);
  
  // Add 3 copies of each card from the chosen attribute
  for (const card of attributeCards) {
    for (let i = 0; i < 3; i++) {
      deck.push(card.id);
      if (deck.length >= 40) break;
    }
    if (deck.length >= 40) break;
  }
  
  // Fill remaining slots with neutral or other cards if needed
  while (deck.length < 40) {
    // Add some basic cards from other attributes
    const otherCards = cards.filter(c => c.attribute !== attribute && c.cost <= 3);
    if (otherCards.length > 0) {
      deck.push(otherCards[Math.floor(Math.random() * otherCards.length)].id);
    } else {
      // If no other cards available, add more copies of existing cards
      deck.push(attributeCards[0].id);
    }
  }
  
  return deck.slice(0, 40);
}

export function createReikiDeck(): string[] {
  const deck: string[] = [];
  
  // Add all Reiki cards (3 copies each)
  const reikiCards = getCardsByAttribute(Attribute.REIKI);
  for (const card of reikiCards) {
    for (let i = 0; i < 3; i++) {
      deck.push(card.id);
    }
  }
  
  // Add a balanced mix of other attributes
  const attributes = [Attribute.BLUE, Attribute.RED, Attribute.YELLOW, Attribute.GREEN];
  for (const attr of attributes) {
    const attrCards = getCardsByAttribute(attr).slice(0, 7);
    for (const card of attrCards) {
      deck.push(card.id);
      if (deck.length >= 40) break;
    }
    if (deck.length >= 40) break;
  }
  
  return deck.slice(0, 40);
}

// Export all cards for easy access
export { cards as allCards };