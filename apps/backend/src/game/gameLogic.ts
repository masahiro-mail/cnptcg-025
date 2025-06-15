import { 
  Card, 
  CardType, 
  Attribute, 
  Phase, 
  FieldPosition, 
  PlayerState, 
  GameState as CommonGameState,
  BaseState 
} from '@cnp-tcg/common-types';

// Extended game state for backend
export interface GameState {
  id: string;
  roomId: string;
  players: Player[];
  currentTurn: number;
  currentPlayer: 'player1' | 'player2';
  turnCount: number;
  turn: number;
  phase: Phase;
  winner: string | null;
  lastAction?: GameAction;
  startTime: number;
}

// Extended player for backend compatibility
export interface Player extends Omit<PlayerState, 'bases' | 'field'> {
  field: Card[]; // Array for backend compatibility
  fieldMap: {
    [FieldPosition.LEFT]: Card | null;
    [FieldPosition.CENTER]: Card | null;
    [FieldPosition.RIGHT]: Card | null;
  };
  unitArea: Card[]; // Dedicated unit area
  bases: {
    [FieldPosition.LEFT]: BaseState;
    [FieldPosition.CENTER]: BaseState;
    [FieldPosition.RIGHT]: BaseState;
  };
  reikiCounts: {
    red: number;
    blue: number;
    yellow: number;
    green: number;
  };
  usedReiki: {
    red: number;
    blue: number;
    yellow: number;
    green: number;
  };
  graveyard: Card[]; // Alias for trash
}

export interface GameAction {
  type: 'draw' | 'play' | 'attack' | 'end_turn' | 'mulligan' | 'surrender' | 'use_reiki' | 'move_unit' | 'use_reiki_color' | 'gauge_to_hand' | 'mark_card_used';
  playerId: number;
  data?: any;
}

export interface ActionResult {
  success: boolean;
  gameState?: GameState;
  error?: string;
}

// Initialize a new game state
export function initializeGameState(playerInfo: Array<{ id: string; name: string }>): GameState {
  const players: Player[] = playerInfo.map(info => {
    const bases = {
      [FieldPosition.LEFT]: { position: FieldPosition.LEFT, health: 2, maxHealth: 2, isDestroyed: false },
      [FieldPosition.CENTER]: { position: FieldPosition.CENTER, health: 2, maxHealth: 2, isDestroyed: false },
      [FieldPosition.RIGHT]: { position: FieldPosition.RIGHT, health: 2, maxHealth: 2, isDestroyed: false }
    };
    
    return {
      id: info.id,
      name: info.name,
      deck: generateStarterDeck(),
      hand: [],
      reikiDeck: generateReikiDeck(),
      reikiZone: [],
      reikiCounts: {
        red: 0,
        blue: 0,
        yellow: 0,
        green: 0
      },
      usedReiki: {
        red: 0,
        blue: 0,
        yellow: 0,
        green: 0
      },
      field: [],
      fieldMap: {
        [FieldPosition.LEFT]: null,
        [FieldPosition.CENTER]: null,
        [FieldPosition.RIGHT]: null
      },
      unitArea: [], // Add dedicated unit area
      bases,
      supporterZone: [],
      trash: [],
      graveyard: [], // Alias for trash
      gauges: {
        [FieldPosition.LEFT]: 0,
        [FieldPosition.CENTER]: 0,
        [FieldPosition.RIGHT]: 0
      },
      mana: 1,
      maxMana: 1
    } as Player;
  });

  // Shuffle decks
  players.forEach(player => {
    shuffleDeck(player.deck);
    shuffleDeck(player.reikiDeck);
  });

  // Draw initial hands and setup gauge cards
  players.forEach(player => {
    // Draw 5 cards for hand
    for (let i = 0; i < 5; i++) {
      drawCard(player);
    }
    
    // Draw 6 cards for gauge (2 per base)
    const gaugeCards: Card[] = [];
    for (let i = 0; i < 6; i++) {
      if (player.deck.length > 0) {
        gaugeCards.push(player.deck.shift()!);
      }
    }
    
    // Assign gauge cards to bases (2 per base)
    let cardIndex = 0;
    Object.keys(player.bases).forEach(position => {
      const base = player.bases[position as FieldPosition];
      base.gaugeCards = [
        gaugeCards[cardIndex] || null,
        gaugeCards[cardIndex + 1] || null
      ].filter(card => card !== null);
      cardIndex += 2;
    });
  });

  const currentTurn = Math.floor(Math.random() * 2);
  return {
    id: `game-${Date.now()}`,
    roomId: `room-${Date.now()}`,
    players,
    currentTurn,
    currentPlayer: currentTurn === 0 ? 'player1' : 'player2',
    turnCount: 1,
    turn: 1,
    phase: Phase.DRAW,
    winner: null,
    startTime: Date.now()
  };
}

// Process a game action
export function processGameAction(
  gameState: GameState,
  action: GameAction,
  playerId: number
): ActionResult {
  // Validate it's the player's turn
  if (playerId !== gameState.currentTurn) {
    return { success: false, error: 'Not your turn' };
  }

  // Deep clone game state to avoid mutations
  const newState = JSON.parse(JSON.stringify(gameState)) as GameState;

  // Process actions based on type
  switch (action.type) {
    case 'mulligan':
      return processMulligan(newState, playerId);
    case 'draw':
      return processDrawCard(newState, playerId);
    case 'play':
      return processPlayCard(newState, playerId, action.data);
    case 'attack':
      return processAttack(newState, playerId, action.data);
    case 'end_turn':
      return processEndTurn(newState, playerId);
    case 'use_reiki':
      return processUseReiki(newState, playerId, action.data);
    case 'move_unit':
      return processMoveUnit(newState, playerId, action.data);
    case 'use_reiki_color':
      return processUseReikiColor(newState, playerId, action.data);
    case 'gauge_to_hand':
      return processGaugeToHand(newState, playerId, action.data);
    case 'mark_card_used':
      return processMarkCardUsed(newState, playerId, action.data);
    case 'surrender':
      return processSurrender(newState, playerId);
    default:
      return { success: false, error: 'Invalid action type' };
  }
}

// Helper functions
function generateStarterDeck(): Card[] {
  const deck: Card[] = [];
  const cardTemplates = [
    // Blue cards (Draw/Return)
    { name: 'Blue Sprite', type: CardType.UNIT, attribute: Attribute.BLUE, cost: 1, bp: 1, sp: 2, text: 'When played: Draw 1 card', defense: 1 },
    { name: 'Tide Caller', type: CardType.UNIT, attribute: Attribute.BLUE, cost: 2, bp: 2, sp: 1, text: 'When destroyed: Return a card to hand', defense: 2 },
    { name: 'Water Shield', type: CardType.EVENT, attribute: Attribute.BLUE, cost: 1, text: 'Return target unit to hand' },
    { name: 'Deep Current', type: CardType.EVENT, attribute: Attribute.BLUE, cost: 3, text: 'Draw 2 cards' },
    
    // Red cards (High damage)
    { name: 'Fire Imp', type: CardType.UNIT, attribute: Attribute.RED, cost: 1, bp: 2, sp: 1, text: 'Cannot block', defense: 1 },
    { name: 'Flame Knight', type: CardType.UNIT, attribute: Attribute.RED, cost: 3, bp: 4, sp: 2, defense: 2 },
    { name: 'Meteor Strike', type: CardType.EVENT, attribute: Attribute.RED, cost: 2, text: 'Deal 3 damage to any target' },
    { name: 'Inferno', type: CardType.EVENT, attribute: Attribute.RED, cost: 4, text: 'Deal 2 damage to all enemy units' },
    
    // Yellow cards (Hand manipulation)
    { name: 'Gold Fairy', type: CardType.UNIT, attribute: Attribute.YELLOW, cost: 2, bp: 1, sp: 2, text: 'When played: Reduce next card cost by 1', defense: 2 },
    { name: 'Merchant', type: CardType.UNIT, attribute: Attribute.YELLOW, cost: 3, bp: 2, sp: 1, text: 'When played: Look at top 3 cards, add 1 to hand', defense: 3 },
    { name: 'Trade', type: CardType.EVENT, attribute: Attribute.YELLOW, cost: 1, text: 'Discard 1 card, draw 2 cards' },
    { name: 'Fortune', type: CardType.SUPPORTER, attribute: Attribute.YELLOW, cost: 2, text: 'Reduce all card costs by 1 this turn' },
    
    // Green cards (Movement/Gauge)
    { name: 'Wind Runner', type: CardType.UNIT, attribute: Attribute.GREEN, cost: 2, bp: 2, sp: 3, text: 'Can move to any empty field', defense: 1 },
    { name: 'Forest Guardian', type: CardType.UNIT, attribute: Attribute.GREEN, cost: 4, bp: 3, sp: 1, text: 'When played: +1 gauge to this position', defense: 4 },
    { name: 'Quick Step', type: CardType.EVENT, attribute: Attribute.GREEN, cost: 1, text: 'Move a unit to another position' },
    { name: 'Nature\'s Blessing', type: CardType.EVENT, attribute: Attribute.GREEN, cost: 3, text: 'All your units gain +1/+1' },
  ];

  // Create 50-card deck with proper distribution
  const distribution = [
    { indices: [0, 1, 4, 5, 8, 9, 12, 13], copies: 3 },  // 1-2 cost units: 24 cards
    { indices: [2, 3, 6, 7, 10, 11, 14, 15], copies: 3 }, // Events/low cost: 24 cards
    { indices: [1, 5, 9, 13], copies: 0.5 }               // Extra copies: 2 cards
  ];
  
  cardTemplates.forEach((template, index) => {
    const baseCount = index < 8 ? 3 : 2;
    for (let i = 0; i < baseCount; i++) {
      deck.push({
        ...template,
        id: `card-${Date.now()}-${index}-${i}`,
        attack: template.bp, // For backend compatibility
        health: template.defense || 0, // For backend compatibility
        currentHealth: template.defense || 0,
        canAttack: false,
        hasAttacked: false,
        rarity: template.cost >= 4 ? 'epic' : template.cost >= 3 ? 'rare' : 'common'
      } as Card);
    }
  });

  // Ensure we have exactly 50 cards
  while (deck.length < 50) {
    const template = cardTemplates[Math.floor(Math.random() * 8)]; // Only basic cards
    deck.push({
      ...template,
      id: `card-${Date.now()}-extra-${deck.length}`,
      attack: template.bp,
      health: template.defense || 0,
      currentHealth: template.defense || 0,
      canAttack: false,
      hasAttacked: false,
      rarity: 'common'
    } as Card);
  }

  return deck;
}

// Helper function to generate Reiki deck
function generateReikiDeck(): Card[] {
  const reikiCards: Card[] = [];
  const reikiTemplates = [
    { name: 'Blue Reiki', type: CardType.EVENT, attribute: Attribute.BLUE, cost: 0, text: 'Gain 1 blue reiki', color: 'blue' },
    { name: 'Red Reiki', type: CardType.EVENT, attribute: Attribute.RED, cost: 0, text: 'Gain 1 red reiki', color: 'red' },
    { name: 'Yellow Reiki', type: CardType.EVENT, attribute: Attribute.YELLOW, cost: 0, text: 'Gain 1 yellow reiki', color: 'yellow' },
    { name: 'Green Reiki', type: CardType.EVENT, attribute: Attribute.GREEN, cost: 0, text: 'Gain 1 green reiki', color: 'green' },
  ];
  
  // 15 total Reiki cards (3-4 of each color)
  const counts = [4, 4, 4, 3]; // red, blue, yellow, green = 15 total
  reikiTemplates.forEach((template, index) => {
    for (let i = 0; i < counts[index]; i++) {
      reikiCards.push({
        ...template,
        id: `reiki-${Date.now()}-${index}-${i}`,
        attack: 0,
        health: 0,
        rarity: 'common'
      } as Card);
    }
  });
  
  return reikiCards;
}

function shuffleDeck(deck: Card[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard(player: Player): Card | null {
  if (player.deck.length === 0) return null;
  
  const card = player.deck.shift()!;
  if (player.hand.length < 10) { // Max hand size
    player.hand.push(card);
    return card;
  }
  
  // Discard if hand is full
  player.graveyard.push(card);
  player.trash.push(card); // Keep both arrays in sync
  return null;
}

function checkWinConditions(gameState: GameState): void {
  gameState.players.forEach((player, index) => {
    // Check if 2 bases are destroyed (alternative win condition)
    const destroyedBases = Object.values(player.bases).filter(base => base.isDestroyed).length;
    if (destroyedBases >= 2) {
      gameState.winner = `player${2 - index}`; // The other player wins
      return;
    }
    
    // Check if all gauge (health) is depleted across all bases
    const totalHealth = Object.values(player.bases).reduce((sum, base) => sum + base.health, 0);
    if (totalHealth <= 0) {
      gameState.winner = `player${2 - index}`; // The other player wins
      return;
    }
    
    // Check if deck is empty
    if (player.deck.length === 0) {
      gameState.winner = `player${2 - index}`; // The other player wins
      return;
    }
  });
}

// Action processors
function processMulligan(
  gameState: GameState,
  playerId: number,
  data?: { keep: boolean }
): ActionResult {
  const player = gameState.players[playerId];
  
  // Return hand to deck
  player.deck.push(...player.hand);
  player.hand = [];
  shuffleDeck(player.deck);
  
  // Draw new hand
  for (let i = 0; i < 5; i++) {
    drawCard(player);
  }
  
  return { success: true, gameState };
}

function processDrawCard(
  gameState: GameState,
  playerId: number
): ActionResult {
  const player = gameState.players[playerId];
  
  if (player.deck.length === 0) {
    return { success: false, error: 'No cards left in deck' };
  }
  
  if (player.hand.length >= 10) {
    return { success: false, error: 'Hand is full' };
  }
  
  const card = drawCard(player);
  
  if (!card && player.deck.length === 0) {
    // Deck is empty - check win conditions
    checkWinConditions(gameState);
  }

  return { success: true, gameState };
}

function processPlayCard(
  gameState: GameState,
  playerId: number,
  data: { cardId: string; position?: FieldPosition; targetZone?: string }
): ActionResult {
  // Remove main phase restriction - allow card movement at any time during player's turn
  // if (gameState.phase !== Phase.MAIN) {
  //   return { success: false, error: 'Can only play cards during main phase' };
  // }

  const player = gameState.players[playerId];
  
  // Find card in hand, field, or supporter zone
  let card: Card | null = null;
  let sourceLocation: 'hand' | 'field' | 'support' | 'fieldMap' | 'unit' = 'hand';
  let sourceIndex = -1;
  let sourcePosition: FieldPosition | null = null;
  
  console.log('DEBUG: Looking for card ID:', data.cardId);
  console.log('DEBUG: Player hand length:', player.hand.length);
  console.log('DEBUG: Player field length:', player.field?.length || 0);
  console.log('DEBUG: Player supporterZone length:', player.supporterZone.length);
  console.log('DEBUG: Player unitArea length:', player.unitArea?.length || 0);
  
  // Check hand first
  const handIndex = player.hand.findIndex(c => c.id === data.cardId);
  if (handIndex !== -1) {
    card = player.hand[handIndex];
    sourceLocation = 'hand';
    sourceIndex = handIndex;
    console.log('DEBUG: Found card in hand:', card.name);
  }
  
  // Check field array
  if (!card) {
    const fieldIndex = player.field.findIndex(c => c.id === data.cardId);
    if (fieldIndex !== -1) {
      card = player.field[fieldIndex];
      sourceLocation = 'field';
      sourceIndex = fieldIndex;
      console.log('DEBUG: Found card in field:', card.name);
    }
  }
  
  // Check fieldMap positions
  if (!card) {
    for (const [pos, fieldCard] of Object.entries(player.fieldMap)) {
      if (fieldCard && fieldCard.id === data.cardId) {
        card = fieldCard;
        sourceLocation = 'fieldMap';
        sourcePosition = pos as FieldPosition;
        console.log('DEBUG: Found card in fieldMap:', card.name, 'at position:', pos);
        break;
      }
    }
  }
  
  // Check supporter zone
  if (!card) {
    const supportIndex = player.supporterZone.findIndex(c => c.id === data.cardId);
    if (supportIndex !== -1) {
      card = player.supporterZone[supportIndex];
      sourceLocation = 'support';
      sourceIndex = supportIndex;
      console.log('DEBUG: Found card in support:', card.name);
    }
  }
  
  // Check unitArea
  if (!card && player.unitArea) {
    const unitIndex = player.unitArea.findIndex(c => c.id === data.cardId);
    if (unitIndex !== -1) {
      card = player.unitArea[unitIndex];
      sourceLocation = 'unit';
      sourceIndex = unitIndex;
      console.log('DEBUG: Found card in unitArea:', card.name);
    }
  }
  
  if (!card) {
    console.log('DEBUG: Card not found anywhere!');
    return { success: false, error: 'Card not found' };
  }
  
  console.log('DEBUG: Card found, proceeding with target zone:', data.targetZone);
  
  // Remove mana restriction for card movement - allow movement regardless of mana cost
  // if ((player.mana || 0) < card.cost) {
  //   return { success: false, error: 'Not enough mana' };
  // }

  // Don't deduct mana cost for card movement
  // player.mana = (player.mana || 0) - card.cost;
  
  // Remove card from source location - comprehensive cleanup
  console.log('DEBUG: Removing card from source location:', sourceLocation, 'Card ID:', card.id);
  
  if (sourceLocation === 'hand') {
    player.hand.splice(sourceIndex, 1);
  } else if (sourceLocation === 'field') {
    player.field.splice(sourceIndex, 1);
    // Also remove from fieldMap if it exists there
    for (const pos in player.fieldMap) {
      if (player.fieldMap[pos as FieldPosition]?.id === card.id) {
        player.fieldMap[pos as FieldPosition] = null;
        console.log('DEBUG: Removed card from fieldMap position:', pos);
      }
    }
  } else if (sourceLocation === 'fieldMap' && sourcePosition) {
    player.fieldMap[sourcePosition] = null;
    // Remove from field array - check all instances
    while (true) {
      const fieldArrayIndex = player.field.findIndex(c => c.id === card.id);
      if (fieldArrayIndex === -1) break;
      player.field.splice(fieldArrayIndex, 1);
      console.log('DEBUG: Removed card from field array at index:', fieldArrayIndex);
    }
  } else if (sourceLocation === 'support') {
    player.supporterZone.splice(sourceIndex, 1);
  } else if (sourceLocation === 'unit' && player.unitArea) {
    player.unitArea.splice(sourceIndex, 1);
  }
  
  // Additional cleanup - remove card from ALL possible locations to prevent duplication
  player.field = player.field.filter(c => c.id !== card.id);
  for (const pos in player.fieldMap) {
    if (player.fieldMap[pos as FieldPosition]?.id === card.id) {
      player.fieldMap[pos as FieldPosition] = null;
    }
  }
  
  console.log('DEBUG: After cleanup, field length:', player.field.length, 'fieldMap:', Object.values(player.fieldMap).filter(c => c !== null).length);
  
  // Don't mark card as used when moving - this should only happen with mark_card_used action
  // card.hasAttacked = true;

  // Handle different target zones
  if (data.targetZone === 'trash') {
    // Move card to trash
    console.log('Moving card to trash:', card.name, 'Current trash count:', player.trash.length);
    console.log('Source location was:', sourceLocation, 'Source index:', sourceIndex, 'Source position:', sourcePosition);
    
    // Ensure card is completely removed from all field-related locations if it was in field
    if (sourceLocation === 'field' || sourceLocation === 'fieldMap') {
      // Remove from field array if exists
      const fieldIndex = player.field.findIndex(c => c.id === card.id);
      if (fieldIndex !== -1) {
        player.field.splice(fieldIndex, 1);
        console.log('Removed card from field array at index:', fieldIndex);
      }
      
      // Remove from fieldMap if exists
      for (const [pos, fieldCard] of Object.entries(player.fieldMap)) {
        if (fieldCard && fieldCard.id === card.id) {
          player.fieldMap[pos as FieldPosition] = null;
          console.log('Removed card from fieldMap at position:', pos);
        }
      }
    }
    
    player.trash.push(card);
    player.graveyard.push(card); // Keep both arrays in sync
    console.log('After trash move, trash count:', player.trash.length, 'graveyard count:', player.graveyard.length);
  } else if (data.targetZone === 'support') {
    // Play to support area - allow any card type for flexibility
    player.supporterZone.push(card);
  } else if (data.targetZone === 'unit') {
    // Play to unit area - allow any card type for flexibility
    if (!player.unitArea) player.unitArea = [];
    player.unitArea.push(card);
  } else if (data.targetZone === 'field' || data.position) {
    // Play to battlefield position
    const position = data.position || FieldPosition.LEFT;
    
    const playedCard = {
      ...card,
      hasAttacked: false,
      canAttack: false,
      fieldPosition: position // Add position tracking
    };
    
    console.log('DEBUG: Playing card to field position:', position);
    
    // Always add to field array for tracking
    player.field.push(playedCard);
    
    // Only set fieldMap if empty, otherwise just add to field array
    if (!player.fieldMap[position]) {
      player.fieldMap[position] = playedCard;
      console.log('DEBUG: Set as main card in fieldMap position:', position);
    } else {
      console.log('DEBUG: Added as additional card to field array for position:', position);
    }
  } else {
    // Default behavior for other card types
    if (card.type === CardType.EVENT) {
      player.trash.push(card);
      player.graveyard.push(card); // Keep both arrays in sync
    } else if (card.type === CardType.SUPPORTER) {
      player.supporterZone.push(card);
    } else {
      // Default to field for units
      player.field.push(card);
    }
  }

  console.log('DEBUG: Action completed successfully. Final trash count:', player.trash.length);
  console.log('DEBUG: Returning success with updated gameState');
  return { success: true, gameState };
}

function processAttack(
  gameState: GameState,
  playerId: number,
  data: { attackerId: string; targetId?: string; targetPosition?: FieldPosition }
): ActionResult {
  // Check if in correct phase
  if (gameState.phase !== Phase.BATTLE) {
    return { success: false, error: 'Can only attack during battle phase' };
  }
  const player = gameState.players[playerId];
  const opponent = gameState.players[1 - playerId];
  
  const attacker = player.field.find(c => c.id === data.attackerId);
  if (!attacker) {
    return { success: false, error: 'Attacker not found' };
  }

  if (attacker.hasAttacked) {
    return { success: false, error: 'Unit has already attacked' };
  }

  if (!attacker.canAttack) {
    return { success: false, error: 'Unit cannot attack this turn' };
  }

  attacker.hasAttacked = true;

  if (data.targetId) {
    // Attack a unit
    const target = opponent.field.find(c => c.id === data.targetId);
    if (!target) {
      return { success: false, error: 'Target not found' };
    }

    // Combat resolution
    target.currentHealth = (target.currentHealth || target.health || 0) - (attacker.attack || attacker.bp || 0);
    attacker.currentHealth = (attacker.currentHealth || attacker.health || 0) - (target.attack || target.bp || 0);

    // Remove destroyed units
    if (target.currentHealth! <= 0) {
      opponent.field = opponent.field.filter(c => c.id !== target.id);
      opponent.trash.push(target);
      opponent.graveyard.push(target); // Keep both arrays in sync
      // Update fieldMap
      for (const pos in opponent.fieldMap) {
        if (opponent.fieldMap[pos as FieldPosition]?.id === target.id) {
          opponent.fieldMap[pos as FieldPosition] = null;
        }
      }
    }

    if (attacker.currentHealth! <= 0) {
      player.field = player.field.filter(c => c.id !== attacker.id);
      player.trash.push(attacker);
      player.graveyard.push(attacker); // Keep both arrays in sync
      // Update fieldMap
      for (const pos in player.fieldMap) {
        if (player.fieldMap[pos as FieldPosition]?.id === attacker.id) {
          player.fieldMap[pos as FieldPosition] = null;
        }
      }
    }
  } else if (data.targetPosition) {
    // Attack a base
    const base = opponent.bases[data.targetPosition];
    if (base.isDestroyed) {
      return { success: false, error: 'Base is already destroyed' };
    }
    
    base.health -= attacker.attack || attacker.bp || 0;
    if (base.health <= 0) {
      base.health = 0;
      base.isDestroyed = true;
    }
  } else {
    return { success: false, error: 'No target specified' };
  }

  checkWinConditions(gameState);
  return { success: true, gameState };
}

function processEndTurn(
  gameState: GameState,
  playerId: number
): ActionResult {
  if (gameState.phase === Phase.BATTLE) {
    // Move to end phase
    gameState.phase = Phase.END;
  } else if (gameState.phase === Phase.END) {
    // Switch turns
    gameState.currentTurn = 1 - gameState.currentTurn;
    gameState.currentPlayer = gameState.currentTurn === 0 ? 'player1' : 'player2';
    gameState.turnCount++;
    gameState.turn++;
    gameState.phase = Phase.DRAW;

    // New turn setup
    const newPlayer = gameState.players[gameState.currentTurn];
    
    // Reset used reiki at start of turn
    newPlayer.usedReiki = {
      red: 0,
      blue: 0,
      yellow: 0,
      green: 0
    };
    
    // Update available mana (total - used)
    const availableReiki = {
      red: newPlayer.reikiCounts.red - newPlayer.usedReiki.red,
      blue: newPlayer.reikiCounts.blue - newPlayer.usedReiki.blue,
      yellow: newPlayer.reikiCounts.yellow - newPlayer.usedReiki.yellow,
      green: newPlayer.reikiCounts.green - newPlayer.usedReiki.green
    };
    
    const totalAvailableReiki = availableReiki.red + availableReiki.blue + availableReiki.yellow + availableReiki.green;
    newPlayer.mana = totalAvailableReiki;
    newPlayer.maxMana = newPlayer.reikiCounts.red + newPlayer.reikiCounts.blue + newPlayer.reikiCounts.yellow + newPlayer.reikiCounts.green;

    // Reset unit attack status
    newPlayer.field.forEach(unit => {
      unit.canAttack = true;
      unit.hasAttacked = false;
    });
    
    // Reset hand card status (remove hasAttacked from all cards)
    newPlayer.hand.forEach(card => {
      card.hasAttacked = false;
      card.canAttack = true;
    });

    // Draw card for new turn
    drawCard(newPlayer);
  } else {
    // Advance phase
    const phases = [Phase.DRAW, Phase.REIKI, Phase.MAIN, Phase.BATTLE, Phase.END];
    const currentIndex = phases.indexOf(gameState.phase);
    if (currentIndex < phases.length - 1) {
      gameState.phase = phases[currentIndex + 1];
    }
  }

  return { success: true, gameState };
}

// Process use reiki action (tapping reiki deck to gain reiki)
function processUseReiki(gameState: GameState, playerId: number, data: { position?: FieldPosition }): ActionResult {
  // Allow tapping reiki deck anytime (not just during reiki phase)
  const player = gameState.players[playerId];
  
  // Draw from reiki deck if available
  if (player.reikiDeck.length > 0) {
    const reikiCard = player.reikiDeck.shift()!;
    player.reikiZone.push(reikiCard);
    
    // Apply reiki effect based on color
    if (reikiCard.name.includes('Blue')) {
      player.reikiCounts.blue += 1;
    } else if (reikiCard.name.includes('Red')) {
      player.reikiCounts.red += 1;
    } else if (reikiCard.name.includes('Yellow')) {
      player.reikiCounts.yellow += 1;
    } else if (reikiCard.name.includes('Green')) {
      player.reikiCounts.green += 1;
    }
    
    // Update total mana
    const availableReiki = {
      red: player.reikiCounts.red - player.usedReiki.red,
      blue: player.reikiCounts.blue - player.usedReiki.blue,
      yellow: player.reikiCounts.yellow - player.usedReiki.yellow,
      green: player.reikiCounts.green - player.usedReiki.green
    };
    
    player.mana = availableReiki.red + availableReiki.blue + availableReiki.yellow + availableReiki.green;
    player.maxMana = player.reikiCounts.red + player.reikiCounts.blue + player.reikiCounts.yellow + player.reikiCounts.green;
  } else {
    return { success: false, error: 'No reiki cards left in deck' };
  }
  
  return { success: true, gameState };
}

// Process move unit action  
function processMoveUnit(gameState: GameState, playerId: number, data: { from: FieldPosition; to: FieldPosition }): ActionResult {
  if (gameState.phase !== Phase.MAIN) {
    return { success: false, error: 'Can only move units during main phase' };
  }

  const player = gameState.players[playerId];
  const unit = player.fieldMap[data.from];
  
  if (!unit) {
    return { success: false, error: 'No unit at source position' };
  }
  
  if (player.fieldMap[data.to]) {
    return { success: false, error: 'Target position is occupied' };
  }
  
  // Move the unit
  player.fieldMap[data.from] = null;
  player.fieldMap[data.to] = unit;
  
  // Update field array for compatibility
  player.field = Object.values(player.fieldMap).filter(c => c !== null) as Card[];
  
  return { success: true, gameState };
}

function processSurrender(
  gameState: GameState,
  playerId: number
): ActionResult {
  // The player who surrenders loses, so the other player wins
  gameState.winner = playerId === 0 ? 'player2' : 'player1';
  return { success: true, gameState };
}

// Process use reiki color action (double-click to mark reiki as used)
function processUseReikiColor(gameState: GameState, playerId: number, data: { color: string }): ActionResult {
  const player = gameState.players[playerId];
  const color = data.color as 'red' | 'blue' | 'yellow' | 'green';
  
  if (!player.reikiCounts[color] || player.reikiCounts[color] === 0) {
    return { success: false, error: `No ${color} reiki available` };
  }
  
  if (player.usedReiki[color] >= player.reikiCounts[color]) {
    return { success: false, error: `All ${color} reiki already used` };
  }
  
  // Mark one reiki of this color as used
  player.usedReiki[color] += 1;
  
  // Update available mana
  const availableReiki = {
    red: player.reikiCounts.red - player.usedReiki.red,
    blue: player.reikiCounts.blue - player.usedReiki.blue,
    yellow: player.reikiCounts.yellow - player.usedReiki.yellow,
    green: player.reikiCounts.green - player.usedReiki.green
  };
  
  player.mana = availableReiki.red + availableReiki.blue + availableReiki.yellow + availableReiki.green;
  
  return { success: true, gameState };
}

// Process gauge to hand action (click gauge card to move to hand)
function processGaugeToHand(gameState: GameState, playerId: number, data: { basePosition: string; cardIndex: number }): ActionResult {
  const player = gameState.players[playerId];
  const basePosition = data.basePosition as FieldPosition;
  const base = player.bases[basePosition];
  
  if (!base || !base.gaugeCards || base.gaugeCards.length === 0) {
    return { success: false, error: 'No gauge cards available at this position' };
  }
  
  if (data.cardIndex >= base.gaugeCards.length || data.cardIndex < 0) {
    return { success: false, error: 'Invalid card index' };
  }
  
  if (player.hand.length >= 10) {
    return { success: false, error: 'Hand is full' };
  }
  
  // Move gauge card to hand
  const gaugeCard = base.gaugeCards.splice(data.cardIndex, 1)[0];
  player.hand.push(gaugeCard);
  
  // Reduce base health if removing gauge card
  base.health = Math.max(0, base.gaugeCards.length);
  if (base.health === 0) {
    base.isDestroyed = true;
  }
  
  checkWinConditions(gameState);
  
  return { success: true, gameState };
}

// Process mark card as used action (right-click or long press)
function processMarkCardUsed(gameState: GameState, playerId: number, data: { cardId: string }): ActionResult {
  const player = gameState.players[playerId];
  
  // Find the card in various locations
  let card: Card | null = null;
  
  console.log('DEBUG: Looking for card to mark as used:', data.cardId);
  
  // Check hand first
  card = player.hand.find(c => c.id === data.cardId) || null;
  if (card) {
    console.log('DEBUG: Found card in hand:', card.name);
  }
  
  // Check field array
  if (!card) {
    card = player.field.find(c => c.id === data.cardId) || null;
    if (card) {
      console.log('DEBUG: Found card in field:', card.name);
    }
  }
  
  // Check fieldMap positions
  if (!card) {
    for (const [pos, fieldCard] of Object.entries(player.fieldMap)) {
      if (fieldCard && fieldCard.id === data.cardId) {
        card = fieldCard;
        console.log('DEBUG: Found card in fieldMap:', card.name, 'at position:', pos);
        break;
      }
    }
  }
  
  // Check supporter zone
  if (!card) {
    card = player.supporterZone.find(c => c.id === data.cardId) || null;
    if (card) {
      console.log('DEBUG: Found card in supporterZone:', card.name);
    }
  }
  
  // Check unitArea
  if (!card && player.unitArea) {
    card = player.unitArea.find(c => c.id === data.cardId) || null;
    if (card) {
      console.log('DEBUG: Found card in unitArea:', card.name);
    }
  }
  
  if (!card) {
    console.log('DEBUG: Card not found anywhere!');
    return { success: false, error: 'Card not found' };
  }
  
  // Toggle the used state
  card.hasAttacked = !card.hasAttacked;
  
  console.log('DEBUG: Card', card.name, 'hasAttacked toggled to:', card.hasAttacked);
  
  return { success: true, gameState };
}

// Export additional helpers
export function getGameStateForPlayers(gameState: GameState): any {
  // Convert backend format to frontend format
  return {
    roomId: gameState.id,
    players: {
      player1: convertPlayerToFrontend(gameState.players[0]),
      player2: convertPlayerToFrontend(gameState.players[1])
    },
    currentPlayer: gameState.currentTurn === 0 ? 'player1' : 'player2',
    phase: gameState.phase,
    turn: gameState.turnCount,
    winner: gameState.winner !== null ? `player${gameState.winner + 1}` : null,
    lastAction: gameState.lastAction
  };
}

function convertPlayerToFrontend(player: Player): any {
  return {
    ...player,
    field: player.field, // Send the full field array for multiple cards per base
    fieldMap: player.fieldMap, // Also send fieldMap for main cards
    trash: player.trash || player.graveyard // Prioritize trash over graveyard
  };
}