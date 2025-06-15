import { create } from 'zustand';
import { 
  GameState as CommonGameState, 
  PlayerState,
  Card,
  Phase,
  FieldPosition,
  BaseState
} from '@cnp-tcg/common-types';

interface GameStore {
  // Game state
  gameState: CommonGameState | null;
  playerId: string | null;
  selectedCard: Card | null;
  selectedFieldSlot: number | null;
  attackingSlot: FieldPosition | null;
  
  // Actions
  setGameState: (state: CommonGameState) => void;
  setPlayerId: (id: string) => void;
  setSelectedCard: (card: Card | null) => void;
  setSelectedFieldSlot: (slot: number | null) => void;
  setAttackingSlot: (slot: FieldPosition | null) => void;
  
  // Computed
  isMyTurn: () => boolean;
  getMyPlayer: () => PlayerState | null;
  getOpponent: () => PlayerState | null;
  canPlayCard: (card: Card) => boolean;
  getValidTargets: (card: Card) => FieldPosition[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  playerId: null,
  selectedCard: null,
  selectedFieldSlot: null,
  attackingSlot: null,
  
  // Actions
  setGameState: (state) => set({ gameState: state }),
  
  setPlayerId: (id) => set({ playerId: id }),
  
  setSelectedCard: (card) => set({ selectedCard: card }),
  
  setSelectedFieldSlot: (slot) => set({ selectedFieldSlot: slot }),
  
  setAttackingSlot: (slot) => set({ attackingSlot: slot }),
  
  // Computed
  isMyTurn: () => {
    const state = get();
    if (!state.gameState || !state.playerId) return false;
    
    // Safely check if players exist
    const player1 = state.gameState.players?.player1;
    if (!player1) return false;
    
    const playerNum = player1.id === state.playerId ? 'player1' : 'player2';
    return state.gameState.currentPlayer === playerNum;
  },
  
  getMyPlayer: () => {
    const state = get();
    if (!state.gameState || !state.playerId) return null;
    
    // Safely check if players exist
    const player1 = state.gameState.players?.player1;
    const player2 = state.gameState.players?.player2;
    
    if (!player1 || !player2) return null;
    
    return player1.id === state.playerId ? player1 : player2;
  },
  
  getOpponent: () => {
    const state = get();
    if (!state.gameState || !state.playerId) return null;
    
    // Safely check if players exist
    const player1 = state.gameState.players?.player1;
    const player2 = state.gameState.players?.player2;
    
    if (!player1 || !player2) return null;
    
    return player1.id === state.playerId ? player2 : player1;
  },
  
  canPlayCard: (card) => {
    const state = get();
    if (!state.isMyTurn()) return false;
    if (!state.gameState) return false;
    
    const player = state.getMyPlayer();
    if (!player) return false;
    
    // Check mana cost
    if ((player.mana || 0) < card.cost) return false;
    
    // Can only play during main phase
    return state.gameState.phase === Phase.MAIN;
  },
  
  getValidTargets: (card) => {
    const state = get();
    const validTargets: FieldPosition[] = [];
    
    if (!state.gameState) return validTargets;
    
    const player = state.getMyPlayer();
    if (!player) return validTargets;
    
    // Check empty field positions for units
    if (card.type === 'UNIT') {
      const positions = [FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT];
      positions.forEach(pos => {
        // Check if field is object format and position is empty
        if (!Array.isArray(player.field) && !player.field[pos]) {
          validTargets.push(pos);
        }
      });
    }
    
    return validTargets;
  },
}));