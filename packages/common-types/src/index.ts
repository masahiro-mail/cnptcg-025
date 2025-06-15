// Card attributes (colors)
export enum Attribute {
  BLUE = 'BLUE',   // Draw/Return
  RED = 'RED',     // High damage
  YELLOW = 'YELLOW', // Hand manipulation/Cost reduction
  GREEN = 'GREEN',  // Movement/Gauge manipulation
  REIKI = 'REIKI'  // Special Reiki cards
}

// Card types
export enum CardType {
  UNIT = 'UNIT',
  EVENT = 'EVENT',
  SUPPORTER = 'SUPPORTER'
}

// Game phases
export enum Phase {
  DRAW = 'DRAW',
  REIKI = 'REIKI',
  MAIN = 'MAIN',
  BATTLE = 'BATTLE',
  END = 'END'
}

// Field positions
export enum FieldPosition {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT'
}

// Card interface
export interface Card {
  id: string;
  name: string;
  type: CardType;
  attribute: Attribute;
  cost: number;
  text: string;
  flavorText?: string;
  // For units
  bp?: number; // Battle Power
  sp?: number; // Speed
  attack?: number; // Alternative to bp for backend compatibility
  defense?: number; // Defense value for units
  health?: number; // Current health for backend compatibility
  currentHealth?: number; // Current health for backend compatibility
  hasAttacked?: boolean; // For battle phase tracking
  canAttack?: boolean; // For attack eligibility
  effect?: string; // Card effect text
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  artUrl?: string;
  fieldPosition?: FieldPosition; // For tracking which base a card belongs to
}

// Base state
export interface BaseState {
  position: FieldPosition;
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  gaugeCards?: Card[]; // Cards used as gauge
}

// Player state
export interface PlayerState {
  id: string;
  name: string;
  deck: Card[];
  hand: Card[];
  reikiDeck: Card[];
  reikiZone: Card[];
  reikiCounts?: {
    red: number;
    blue: number;
    yellow: number;
    green: number;
  };
  usedReiki?: {
    red: number;
    blue: number;
    yellow: number;
    green: number;
  };
  field: Card[] | {
    [FieldPosition.LEFT]: Card | null;
    [FieldPosition.CENTER]: Card | null;
    [FieldPosition.RIGHT]: Card | null;
  };
  fieldMap?: {
    [FieldPosition.LEFT]: Card | null;
    [FieldPosition.CENTER]: Card | null;
    [FieldPosition.RIGHT]: Card | null;
  };
  unitArea?: Card[]; // Additional unit area for backend compatibility
  bases: {
    [FieldPosition.LEFT]: BaseState;
    [FieldPosition.CENTER]: BaseState;
    [FieldPosition.RIGHT]: BaseState;
  };
  supporterZone: Card[];
  trash: Card[];
  gauges: {
    [FieldPosition.LEFT]: number;
    [FieldPosition.CENTER]: number;
    [FieldPosition.RIGHT]: number;
  };
  mana?: number; // For backend compatibility
  maxMana?: number; // For backend compatibility
}

// Game state
export interface GameState {
  roomId: string;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  currentPlayer: 'player1' | 'player2';
  phase: Phase;
  turn: number;
  winner: string | null;
  lastAction?: GameAction;
}

// Game actions
export interface GameAction {
  type: 'DRAW_CARD' | 'PLAY_CARD' | 'ATTACK' | 'END_TURN' | 'USE_REIKI' | 'MOVE_UNIT' | 'ACTIVATE_EFFECT';
  playerId: string;
  data: any;
  timestamp: number;
}

// Socket events
export enum SocketEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // Matchmaking
  FIND_MATCH = 'find-match',
  MATCH_FOUND = 'match-found',
  CANCEL_MATCHMAKING = 'cancel-matchmaking',
  
  // Game
  GAME_START = 'game-start',
  GAME_UPDATE = 'game-update',
  GAME_ACTION = 'game-action',
  GAME_END = 'game-end',
  
  // Chat
  CHAT_MESSAGE = 'chat-message',
  
  // Errors
  ERROR = 'error'
}

// Match data
export interface MatchData {
  roomId: string;
  opponentId: string;
  opponentName: string;
  startingPlayer: 'player1' | 'player2';
}

// Deck validation
export interface DeckValidation {
  valid: boolean;
  errors: string[];
}

// Alias for compatibility
export type DeckValidationResult = DeckValidation;

// Effect types for cards
export interface CardEffect {
  type: 'DAMAGE' | 'DRAW' | 'DISCARD' | 'BOUNCE' | 'COST_REDUCE' | 'MOVE' | 'GAUGE_MODIFY' | 'BUFF' | 'DEBUFF';
  value?: number;
  target?: 'SELF' | 'OPPONENT' | 'BOTH' | 'UNIT' | 'ALL_UNITS';
  condition?: string;
}