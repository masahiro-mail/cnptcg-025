import { GameState, initializeGameState } from './gameLogic';
import { GameSetupData, PlayerSetupData } from './deckbuilderIntegration';

interface Player {
  socketId: string;
  playerId: string;
  playerName: string;
  connected: boolean;
}

interface GameRoom {
  id: string;
  players: Player[];
  gameState: GameState;
  setupData?: GameSetupData;
  playersGameReady?: boolean[];
  createdAt: number;
  active: boolean;
}

interface MatchmakingQueue {
  socketId: string;
  playerId: string;
  playerName: string;
  joinedAt: number;
}

export class RoomManager {
  private rooms: Map<string, GameRoom>;
  private playerRoomMap: Map<string, string>; // socketId -> roomId
  private matchmakingQueue: MatchmakingQueue[];
  private roomIdCounter: number;

  constructor() {
    this.rooms = new Map();
    this.playerRoomMap = new Map();
    this.matchmakingQueue = [];
    this.roomIdCounter = 1;
  }

  // Matchmaking methods
  findMatch(socketId: string, playerId: string, playerName: string): { matched: boolean; roomId?: string } {
    // Check if player is already in a room
    if (this.playerRoomMap.has(socketId)) {
      return { matched: false };
    }

    // Check if there's someone in the queue
    if (this.matchmakingQueue.length > 0) {
      // Match with first player in queue
      const opponent = this.matchmakingQueue.shift()!;
      
      // Create new game room
      const roomId = this.createGame([
        { socketId: opponent.socketId, playerId: opponent.playerId, playerName: opponent.playerName },
        { socketId, playerId, playerName }
      ]);

      return { matched: true, roomId };
    } else {
      // Add to queue
      this.matchmakingQueue.push({
        socketId,
        playerId,
        playerName,
        joinedAt: Date.now()
      });
      
      return { matched: false };
    }
  }

  cancelMatchmaking(socketId: string): boolean {
    const index = this.matchmakingQueue.findIndex(q => q.socketId === socketId);
    if (index !== -1) {
      this.matchmakingQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  removeFromQueue(socketId: string): void {
    this.matchmakingQueue = this.matchmakingQueue.filter(q => q.socketId !== socketId);
  }

  // Room management methods
  createGame(players: Array<{ socketId: string; playerId: string; playerName: string }>): string {
    const roomId = `room-${this.roomIdCounter++}`;
    
    // Initialize game state
    const gameState = initializeGameState(
      players.map(p => ({ id: p.playerId, name: p.playerName }))
    );

    // Create room
    const room: GameRoom = {
      id: roomId,
      players: players.map(p => ({
        ...p,
        connected: true
      })),
      gameState,
      createdAt: Date.now(),
      active: true
    };

    // Store room and player mappings
    this.rooms.set(roomId, room);
    players.forEach(p => {
      this.playerRoomMap.set(p.socketId, roomId);
    });

    return roomId;
  }

  getRoom(roomId: string): GameRoomWrapper | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    return new GameRoomWrapper(room);
  }

  getGameState(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    return room ? room.gameState : null;
  }

  updateGameState(roomId: string, gameState: GameState): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    room.gameState = gameState;
    return true;
  }

  getPlayerRoom(socketId: string): string | null {
    return this.playerRoomMap.get(socketId) || null;
  }

  endGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Mark room as inactive
    room.active = false;

    // Remove player mappings
    room.players.forEach(p => {
      this.playerRoomMap.delete(p.socketId);
    });

    // Keep room for a while for stats/history
    setTimeout(() => {
      this.rooms.delete(roomId);
    }, 300000); // Remove after 5 minutes
  }

  // Setup data methods
  initializeSetupData(roomId: string): GameSetupData {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const setupData: GameSetupData = {
      player1: {
        playerId: room.players[0].playerId,
        playerName: room.players[0].playerName,
        isReady: false
      },
      player2: {
        playerId: room.players[1].playerId,
        playerName: room.players[1].playerName,
        isReady: false
      },
      phase: 'deck_input',
      firstPlayerId: null
    };

    room.setupData = setupData;
    room.playersGameReady = [false, false];
    
    return setupData;
  }

  getSetupData(roomId: string): GameSetupData | null {
    const room = this.rooms.get(roomId);
    return room?.setupData || null;
  }

  updateSetupData(roomId: string, setupData: GameSetupData): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    room.setupData = setupData;
    return true;
  }

  markPlayerGameReady(roomId: string, playerIndex: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.playersGameReady) return false;
    
    room.playersGameReady[playerIndex] = true;
    return true;
  }

  areBothPlayersGameReady(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.playersGameReady) return false;
    
    return room.playersGameReady[0] && room.playersGameReady[1];
  }

  updatePlayerSocket(playerId: string, newSocketId: string): boolean {
    // Find room containing this player
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.playerId === playerId);
      if (player) {
        // Update old socket mapping
        this.playerRoomMap.delete(player.socketId);
        // Update player's socket ID
        player.socketId = newSocketId;
        // Add new socket mapping
        this.playerRoomMap.set(newSocketId, roomId);
        return true;
      }
    }
    return false;
  }

  // Utility methods
  getActiveRoomsCount(): number {
    return Array.from(this.rooms.values()).filter(r => r.active).length;
  }

  getQueueLength(): number {
    return this.matchmakingQueue.length;
  }

  // Clean up old inactive rooms
  cleanup(): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    this.rooms.forEach((room, roomId) => {
      if (!room.active && now - room.createdAt > fiveMinutes) {
        this.rooms.delete(roomId);
      }
    });

    // Clean up disconnected players from queue
    this.matchmakingQueue = this.matchmakingQueue.filter(
      q => now - q.joinedAt < 60000 // Remove if waiting more than 1 minute
    );
  }
}

// Wrapper class to provide safe access to room data
export class GameRoomWrapper {
  constructor(private room: GameRoom) {}

  getGameState(): GameState {
    return this.room.gameState;
  }

  updateGameState(gameState: GameState): void {
    this.room.gameState = gameState;
  }

  getPlayerIndex(socketId: string): number {
    return this.room.players.findIndex(p => p.socketId === socketId);
  }

  getOpponentSocketId(socketId: string): string | null {
    const player = this.room.players.find(p => p.socketId !== socketId);
    return player ? player.socketId : null;
  }

  playerDisconnected(socketId: string): void {
    const player = this.room.players.find(p => p.socketId === socketId);
    if (player) {
      player.connected = false;
    }
  }

  isPlayerDisconnected(socketId: string): boolean {
    const player = this.room.players.find(p => p.socketId === socketId);
    return player ? !player.connected : true;
  }

  reconnectPlayer(playerId: string, newSocketId: string): boolean {
    const player = this.room.players.find(p => p.playerId === playerId);
    if (player && !player.connected) {
      player.socketId = newSocketId;
      player.connected = true;
      return true;
    }
    return false;
  }
}