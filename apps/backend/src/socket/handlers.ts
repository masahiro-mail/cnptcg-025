import { Server, Socket } from 'socket.io';
import { RoomManager } from '../game/roomManager';
import { processGameAction } from '../game/gameLogic';
import { 
  validateDeck, 
  validateReikiConfiguration,
  createGameStateFromSetup,
  generateReikiDeck,
  dealInitialHand,
  processMulligan,
  placeGaugeCards,
  DeckBuilderCard,
  GameSetupData,
  PlayerSetupData,
  ReikiConfiguration
} from '../game/deckbuilderIntegration';

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      handleDisconnect(socket, roomManager, io);
    });

    // Matchmaking handlers
    socket.on('find-match', (data: { playerId: string; playerName: string }) => {
      handleFindMatch(socket, data, roomManager, io);
    });

    socket.on('cancel-matchmaking', () => {
      handleCancelMatchmaking(socket, roomManager);
    });

    // Game action handlers
    socket.on('game-action', (action: any) => {
      handleGameAction(socket, action, roomManager, io);
    });

    // Chat handlers
    socket.on('send-message', (data: { message: string; roomId: string }) => {
      handleSendMessage(socket, data, io);
    });

    // Reconnection handler
    socket.on('reconnect-game', (data: { playerId: string; roomId: string }) => {
      handleReconnect(socket, data, roomManager, io);
    });

    // Game setup handlers
    socket.on('validate-deck', (data: { deckId: string; cards: DeckBuilderCard[] }) => {
      handleValidateDeck(socket, data, roomManager);
    });

    socket.on('submit-deck', (data: { roomId: string; playerId: string; deckId: string; cards: DeckBuilderCard[] }) => {
      handleSubmitDeck(socket, data, roomManager, io);
    });

    socket.on('submit-reiki-config', (data: { roomId: string; playerId: string; config: ReikiConfiguration }) => {
      handleSubmitReikiConfig(socket, data, roomManager, io);
    });

    socket.on('submit-mulligan', (data: { roomId: string; playerId: string; selectedIndices: number[] }) => {
      handleSubmitMulligan(socket, data, roomManager, io);
    });

    socket.on('ready-for-game', (data: { roomId: string; playerId: string }) => {
      handleReadyForGame(socket, data, roomManager, io);
    });

    socket.on('start-deck-setup', (data: { roomId: string }) => {
      handleStartDeckSetup(socket, data, roomManager, io);
    });

    socket.on('join-room', (data: { roomId: string; playerId: string }) => {
      handleJoinRoom(socket, data, roomManager, io);
    });
  });
}

// Handler functions
function handleDisconnect(socket: Socket, roomManager: RoomManager, io: Server) {
  const roomId = roomManager.getPlayerRoom(socket.id);
  
  if (roomId) {
    const room = roomManager.getRoom(roomId);
    if (room) {
      // Notify other player about disconnection
      socket.to(roomId).emit('opponent-disconnected');
      
      // Mark player as disconnected but keep room alive for reconnection
      room.playerDisconnected(socket.id);
      
      // Set timeout to end game if player doesn't reconnect
      setTimeout(() => {
        if (room.isPlayerDisconnected(socket.id)) {
          roomManager.endGame(roomId);
          io.to(roomId).emit('game-ended', { reason: 'disconnect' });
        }
      }, 30000); // 30 seconds to reconnect
    }
  }
  
  // Remove from matchmaking queue if present
  roomManager.removeFromQueue(socket.id);
}

function handleFindMatch(
  socket: Socket,
  data: { playerId: string; playerName: string },
  roomManager: RoomManager,
  io: Server
) {
  const result = roomManager.findMatch(socket.id, data.playerId, data.playerName);
  
  if (result.matched) {
    // Match found - notify both players
    const room = roomManager.getRoom(result.roomId!);
    if (room) {
      // Join both sockets to the room
      socket.join(result.roomId!);
      
      // Get opponent socket and join them too
      const opponentSocketId = room.getOpponentSocketId(socket.id);
      if (opponentSocketId) {
        const opponentSocket = io.sockets.sockets.get(opponentSocketId);
        if (opponentSocket) {
          opponentSocket.join(result.roomId!);
        }
      }
      
      // Initialize setup data for deck builder flow
      const setupData = roomManager.initializeSetupData(result.roomId!);
      
      // Emit match found with setup flow to both players individually
      socket.emit('match-found', {
        roomId: result.roomId,
        setupData: setupData,
        phase: 'deck_input'
      });
      
      if (opponentSocketId) {
        const opponentSocket = io.sockets.sockets.get(opponentSocketId);
        if (opponentSocket) {
          opponentSocket.emit('match-found', {
            roomId: result.roomId,
            setupData: setupData,
            phase: 'deck_input'
          });
        }
      }
    }
  } else {
    // Added to queue
    socket.emit('searching-match');
  }
}

function handleCancelMatchmaking(socket: Socket, roomManager: RoomManager) {
  roomManager.cancelMatchmaking(socket.id);
  socket.emit('matchmaking-cancelled');
}

function handleGameAction(
  socket: Socket,
  action: any,
  roomManager: RoomManager,
  io: Server
) {
  const roomId = roomManager.getPlayerRoom(socket.id);
  
  if (!roomId) {
    socket.emit('error', { message: 'Not in a game room' });
    return;
  }
  
  const room = roomManager.getRoom(roomId);
  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }
  
  const gameState = room.getGameState();
  const playerIndex = room.getPlayerIndex(socket.id);
  
  if (playerIndex === -1) {
    socket.emit('error', { message: 'Player not found in room' });
    return;
  }
  
  // Process the game action
  const result = processGameAction(gameState, action, playerIndex);
  
  if (result.success) {
    // Update game state in room
    room.updateGameState(result.gameState!);
    
    // Convert game state to frontend format
    const { getGameStateForPlayers } = require('../game/gameLogic');
    const frontendGameState = getGameStateForPlayers(result.gameState!);
    
    // Emit updated state to both players
    io.to(roomId).emit('game-state-update', {
      gameState: frontendGameState,
      lastAction: action,
      playerId: playerIndex
    });
    
    // Check for game end
    if (result.gameState!.winner !== null) {
      io.to(roomId).emit('game-ended', {
        winner: result.gameState!.winner,
        reason: 'victory'
      });
      roomManager.endGame(roomId);
    }
  } else {
    // Send error only to the player who made the invalid action
    socket.emit('action-error', {
      message: result.error,
      action: action
    });
  }
}

function handleSendMessage(
  socket: Socket,
  data: { message: string; roomId: string },
  io: Server
) {
  // Validate message
  if (!data.message || data.message.trim().length === 0) {
    return;
  }
  
  // Emit message to room
  io.to(data.roomId).emit('chat-message', {
    playerId: socket.id,
    message: data.message.trim(),
    timestamp: Date.now()
  });
}

function handleReconnect(
  socket: Socket,
  data: { playerId: string; roomId: string },
  roomManager: RoomManager,
  io: Server
) {
  const room = roomManager.getRoom(data.roomId);
  
  if (!room) {
    socket.emit('reconnect-failed', { reason: 'Room not found' });
    return;
  }
  
  // Attempt to reconnect player
  const success = room.reconnectPlayer(data.playerId, socket.id);
  
  if (success) {
    // Join socket room
    socket.join(data.roomId);
    
    // Send current game state
    socket.emit('reconnect-success', {
      gameState: room.getGameState()
    });
    
    // Notify opponent
    socket.to(data.roomId).emit('opponent-reconnected');
  } else {
    socket.emit('reconnect-failed', { reason: 'Cannot reconnect to this room' });
  }
}

// Game setup handler functions
function handleSubmitDeck(
  socket: Socket,
  data: { roomId: string; playerId: string; deckId: string; cards: DeckBuilderCard[] },
  roomManager: RoomManager,
  io: Server
) {
  console.log(`Handling deck submission for player ${data.playerId} in room ${data.roomId}`);
  
  const room = roomManager.getRoom(data.roomId);
  if (!room) {
    console.error(`Room ${data.roomId} not found`);
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  try {
    // Validate deck data exists
    if (!data.cards || !Array.isArray(data.cards)) {
      console.error('Invalid deck data received:', data.cards);
      socket.emit('deck-submit-error', {
        message: 'Invalid deck data',
        errors: ['Deck data is missing or corrupted']
      });
      return;
    }

    console.log(`Validating deck with ${data.cards.length} cards`);

    // Validate deck
    const validation = validateDeck(data.cards);
    if (!validation.isValid) {
      console.error('Deck validation failed:', validation.errors);
      socket.emit('deck-submit-error', {
        message: 'Deck validation failed',
        errors: validation.errors
      });
      return;
    }

    // Convert deck builder cards to game cards
    console.log('Converting deck builder cards to game cards');
    const { convertDeckBuilderCard } = require('../game/deckbuilderIntegration');
    const gameCards = data.cards.map((card: DeckBuilderCard, index: number) => {
      try {
        const converted = convertDeckBuilderCard(card);
        if (index < 5) { // Log first 5 cards for debugging
          console.log(`Converted card ${index + 1}:`, {
            id: card.id,
            name: card.name,
            type: card.type,
            cost: card.cost
          });
        }
        return converted;
      } catch (error) {
        console.warn(`Failed to convert card ${card.id}:`, error);
        // Return a fallback card structure
        return {
          id: card.id,
          name: card.name || 'Unknown Card',
          type: card.type || 'ユニット',
          cost: card.cost || 1,
          attribute: 'NEUTRAL',
          text: card.description || '',
          bp: typeof card.bp === 'string' ? parseInt(card.bp) || 100 : card.bp || 100,
          sp: typeof card.sp === 'string' ? parseInt(card.sp) || 100 : card.sp || 100
        };
      }
    });

    // Store deck in setup data
    const setupData = roomManager.getSetupData(data.roomId);
    if (!setupData) {
      console.error(`Setup data not found for room ${data.roomId}`);
      socket.emit('error', { message: 'Setup data not found' });
      return;
    }

    const playerData = setupData.player1.playerId === data.playerId ? setupData.player1 : setupData.player2;
    playerData.deckId = data.deckId;
    playerData.deck = gameCards;
    playerData.isReady = true;

    console.log('Checking if both players have submitted decks:', {
      player1HasDeck: !!setupData.player1.deck,
      player2HasDeck: !!setupData.player2.deck,
      player1Id: setupData.player1.playerId,
      player2Id: setupData.player2.playerId
    });

    // Check if both players have submitted their decks
    if (setupData.player1.deck && setupData.player2.deck) {
      console.log('Both players have submitted decks, moving to REIKI selection');
      // Both decks submitted, move to REIKI selection
      setupData.phase = 'reiki_selection';
      setupData.player1.isReady = false;
      setupData.player2.isReady = false;

      // Add a small delay to ensure all socket events are processed properly
      setTimeout(() => {
        // Notify both players to proceed to REIKI selection
        console.log('Emitting decks-submitted event to room:', data.roomId);
        try {
          io.to(data.roomId).emit('decks-submitted', {
            setupData: setupData,
            phase: 'reiki_selection'
          });
          console.log('Successfully emitted decks-submitted event');
        } catch (emitError) {
          console.error('Failed to emit decks-submitted event:', emitError);
        }
      }, 100); // 100ms delay to prevent race conditions
    } else {
      console.log('Still waiting for other player deck submission');
      // Notify about deck submission progress
      io.to(data.roomId).emit('setup-progress', {
        phase: 'deck_input',
        playersReady: {
          [setupData.player1.playerId]: !!setupData.player1.deck,
          [setupData.player2.playerId]: !!setupData.player2.deck
        }
      });
    }

    console.log('Emitting deck-submitted confirmation to player:', data.playerId);
    socket.emit('deck-submitted');
  } catch (error) {
    console.error('Error in handleSubmitDeck:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      playerId: data.playerId,
      roomId: data.roomId
    });
    
    socket.emit('deck-submit-error', {
      message: error instanceof Error ? error.message : 'Failed to submit deck'
    });
  }
}

function handleValidateDeck(
  socket: Socket,
  data: { deckId: string; cards: DeckBuilderCard[] },
  roomManager: RoomManager
) {
  try {
    const validation = validateDeck(data.cards);
    
    socket.emit('deck-validation-result', {
      deckId: data.deckId,
      isValid: validation.isValid,
      errors: validation.errors,
      cardCount: data.cards.length
    });
  } catch (error) {
    socket.emit('deck-validation-error', {
      deckId: data.deckId,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    });
  }
}

function handleSubmitReikiConfig(
  socket: Socket,
  data: { roomId: string; playerId: string; config: ReikiConfiguration },
  roomManager: RoomManager,
  io: Server
) {
  const room = roomManager.getRoom(data.roomId);
  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  try {
    // Validate REIKI configuration
    if (!validateReikiConfiguration(data.config)) {
      socket.emit('reiki-config-error', { 
        message: 'Invalid REIKI configuration. Total must be exactly 15.' 
      });
      return;
    }

    // Store REIKI config in room's setup data
    const setupData = roomManager.getSetupData(data.roomId) || roomManager.initializeSetupData(data.roomId);
    const playerData = setupData.player1.playerId === data.playerId ? setupData.player1 : setupData.player2;
    
    playerData.reikiConfig = data.config;
    playerData.isReady = true;

    // Check if both players have submitted their REIKI configs
    if (setupData.player1.reikiConfig && setupData.player2.reikiConfig) {
      // Auto-determine turn order (random)
      const firstPlayerId = Math.random() < 0.5 ? setupData.player1.playerId : setupData.player2.playerId;
      setupData.firstPlayerId = firstPlayerId;
      setupData.phase = 'initial_hand';

      // Deal initial hands to both players
      dealInitialHandsForBothPlayers(setupData, roomManager, data.roomId);

      // Advance to mulligan phase
      setupData.phase = 'mulligan';
      
      // Notify both players about turn order and proceed to mulligan
      io.to(data.roomId).emit('reiki-phase-complete', {
        firstPlayerId: firstPlayerId,
        setupData: setupData
      });
    } else {
      // Notify players about progress
      io.to(data.roomId).emit('setup-progress', {
        phase: 'reiki_selection',
        playersReady: {
          [setupData.player1.playerId]: !!setupData.player1.reikiConfig,
          [setupData.player2.playerId]: !!setupData.player2.reikiConfig
        }
      });
    }

    socket.emit('reiki-config-submitted');
  } catch (error) {
    socket.emit('reiki-config-error', {
      message: error instanceof Error ? error.message : 'Failed to submit REIKI configuration'
    });
  }
}

function handleSubmitMulligan(
  socket: Socket,
  data: { roomId: string; playerId: string; selectedIndices: number[] },
  roomManager: RoomManager,
  io: Server
) {
  const room = roomManager.getRoom(data.roomId);
  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  try {
    const setupData = roomManager.getSetupData(data.roomId);
    if (!setupData) {
      socket.emit('error', { message: 'Setup data not found' });
      return;
    }

    const playerData = setupData.player1.playerId === data.playerId ? setupData.player1 : setupData.player2;
    
    if (!playerData.initialHand) {
      socket.emit('mulligan-error', { message: 'Initial hand not found' });
      return;
    }

    // Process mulligan
    const mulliganResult = processMulligan(
      playerData.initialHand,
      playerData.remainingDeck || [],
      data.selectedIndices
    );

    playerData.finalHand = mulliganResult.newHand;
    playerData.remainingDeck = mulliganResult.newDeck;
    playerData.mulliganSelection = data.selectedIndices;
    playerData.isReady = true;

    // Check if both players have completed mulligan
    if (setupData.player1.finalHand && setupData.player2.finalHand) {
      // Auto-place gauge cards for both players
      placeGaugeCardsForBothPlayers(setupData);
      
      // Move to game ready phase
      setupData.phase = 'game_ready';

      // Create actual game state
      const gameState = createGameStateFromSetup(setupData);
      gameState.roomId = data.roomId;

      // Update room with new game state
      room.updateGameState(gameState);

      // Notify both players that setup is complete
      io.to(data.roomId).emit('setup-complete', {
        gameState: getGameStateForPlayers(gameState),
        setupData: setupData
      });
    } else {
      // Notify players about mulligan progress
      io.to(data.roomId).emit('setup-progress', {
        phase: 'mulligan',
        playersReady: {
          [setupData.player1.playerId]: !!setupData.player1.finalHand,
          [setupData.player2.playerId]: !!setupData.player2.finalHand
        }
      });
    }

    socket.emit('mulligan-submitted');
  } catch (error) {
    socket.emit('mulligan-error', {
      message: error instanceof Error ? error.message : 'Failed to process mulligan'
    });
  }
}

function handleReadyForGame(
  socket: Socket,
  data: { roomId: string; playerId: string },
  roomManager: RoomManager,
  io: Server
) {
  const room = roomManager.getRoom(data.roomId);
  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  try {
    const setupData = roomManager.getSetupData(data.roomId);
    if (!setupData || setupData.phase !== 'game_ready') {
      socket.emit('error', { message: 'Game is not ready to start' });
      return;
    }

    // Mark player as ready for actual game
    const playerIndex = setupData.player1.playerId === data.playerId ? 0 : 1;
    roomManager.markPlayerGameReady(data.roomId, playerIndex);

    // Check if both players are ready
    if (roomManager.areBothPlayersGameReady(data.roomId)) {
      // Start the actual game
      const gameState = room.getGameState();
      const { getGameStateForPlayers } = require('../game/gameLogic');
      const frontendGameState = getGameStateForPlayers(gameState);

      io.to(data.roomId).emit('game-started', {
        gameState: frontendGameState
      });
    } else {
      // Notify about readiness status
      io.to(data.roomId).emit('waiting-for-players', {
        message: 'Waiting for other player to ready up...'
      });
    }

    socket.emit('ready-acknowledged');
  } catch (error) {
    socket.emit('error', {
      message: error instanceof Error ? error.message : 'Failed to mark player as ready'
    });
  }
}

function handleStartDeckSetup(
  socket: Socket,
  data: { roomId: string },
  roomManager: RoomManager,
  io: Server
) {
  const room = roomManager.getRoom(data.roomId);
  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  try {
    // Initialize setup data for the room
    const setupData = roomManager.initializeSetupData(data.roomId);
    
    // Notify both players to start deck setup
    io.to(data.roomId).emit('deck-setup-started', {
      setupData: setupData,
      phase: 'deck_input'
    });
  } catch (error) {
    socket.emit('error', {
      message: error instanceof Error ? error.message : 'Failed to start deck setup'
    });
  }
}

// Helper functions
function dealInitialHandsForBothPlayers(setupData: GameSetupData, roomManager: RoomManager, roomId: string) {
  // Deal initial hands for both players
  [setupData.player1, setupData.player2].forEach(playerData => {
    if (playerData.deck) {
      const handResult = dealInitialHand(playerData.deck, 5);
      playerData.initialHand = handResult.hand;
      playerData.remainingDeck = handResult.remainingDeck;
      playerData.isReady = false; // Reset for mulligan phase
    }
  });
}

function placeGaugeCardsForBothPlayers(setupData: GameSetupData) {
  // Place gauge cards for both players
  [setupData.player1, setupData.player2].forEach(playerData => {
    if (playerData.remainingDeck) {
      const gaugeResult = placeGaugeCards(playerData.remainingDeck);
      playerData.gaugeCards = [
        ...gaugeResult.gaugeCards.LEFT,
        ...gaugeResult.gaugeCards.CENTER, 
        ...gaugeResult.gaugeCards.RIGHT
      ];
      playerData.remainingDeck = gaugeResult.remainingDeck;
    }
  });
}

function handleJoinRoom(
  socket: Socket,
  data: { roomId: string; playerId: string },
  roomManager: RoomManager,
  io: Server
) {
  console.log(`Player ${data.playerId} attempting to join room ${data.roomId}`);
  
  const room = roomManager.getRoom(data.roomId);
  if (!room) {
    console.error(`Room ${data.roomId} not found`);
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  try {
    // Join the socket room
    socket.join(data.roomId);
    console.log(`Socket ${socket.id} joined room ${data.roomId}`);
    
    // Update player's socket ID in room manager
    roomManager.updatePlayerSocket(data.playerId, socket.id);
    
    // Get or initialize setup data
    let setupData = roomManager.getSetupData(data.roomId);
    if (!setupData) {
      console.log(`Initializing setup data for room ${data.roomId}`);
      setupData = roomManager.initializeSetupData(data.roomId);
    }
    
    // Validate setup data
    if (!setupData.player1 || !setupData.player2) {
      console.error(`Invalid setup data for room ${data.roomId}:`, setupData);
      socket.emit('error', { message: 'Invalid room setup data' });
      return;
    }
    
    // Send setup data to the player
    socket.emit('deck-setup-started', {
      setupData: setupData,
      phase: setupData.phase
    });
    
    console.log(`Player ${data.playerId} successfully joined room ${data.roomId} with socket ${socket.id}`);
    console.log(`Current setup phase: ${setupData.phase}`);
  } catch (error) {
    console.error(`Error joining room ${data.roomId}:`, error);
    socket.emit('error', {
      message: error instanceof Error ? error.message : 'Failed to join room'
    });
  }
}

function getGameStateForPlayers(gameState: any) {
  const { getGameStateForPlayers } = require('../game/gameLogic');
  return getGameStateForPlayers(gameState);
}