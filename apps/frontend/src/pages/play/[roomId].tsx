import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import io, { Socket } from 'socket.io-client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useDrop } from 'react-dnd';
import { useGameStore } from '../../store/gameStore';
// import GameBoard from '../../components/GameBoard';
import PlayerHand from '../../components/PlayerHand';
// import GameInfo from '../../components/GameInfo';
// import PhaseIndicator from '../../components/PhaseIndicator';
import Chat from '../../components/Chat';
import GameEndAnimation from '../../components/GameEndAnimation';
import FieldCard from '../../components/FieldCard';
import { 
  GameState,
  Card,
  // GameAction,
  // SocketEvent,
  FieldPosition 
} from '@cnp-tcg/common-types';

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export default function Play() {
  const router = useRouter();
  const { roomId } = router.query;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameEndState, setGameEndState] = useState<{ isVisible: boolean; isVictory: boolean } | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [reikiLongPressTimer, setReikiLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // プレイヤーの先行/後攻を判定（先行＝青、後攻＝赤）
  const getPlayerCardBackColor = () => {
    const player = getMyPlayer();
    if (!player || !gameState) return 'blue';
    
    // player1が先行、player2が後攻と仮定
    const isFirstPlayer = gameState.players.player1.id === player.id;
    return isFirstPlayer ? 'blue' : 'red';
  };
  
  const getOpponentCardBackColor = () => {
    const playerColor = getPlayerCardBackColor();
    return playerColor === 'blue' ? 'red' : 'blue';
  };
  
  const {
    gameState,
    setGameState,
    setPlayerId,
    isMyTurn,
    getMyPlayer,
    getOpponent,
  } = useGameStore();

  useEffect(() => {
    if (!roomId || typeof roomId !== 'string') return;

    const playerName = sessionStorage.getItem('playerName');
    const playerId = sessionStorage.getItem('playerId');
    if (!playerName || !playerId) {
      router.push('/');
      return;
    }

    setPlayerId(playerId);

    // Connect to socket.io server
    const socketInstance = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Join the room by emitting find-match again (if not already matched)
      socketInstance.emit('find-match', { playerId, playerName });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('game-state-update', (data: { gameState: GameState }) => {
      console.log('Game state updated:', data.gameState);
      console.log('DEBUG: Player trash count after update:', data.gameState.players.player1?.trash?.length || 0, data.gameState.players.player2?.trash?.length || 0);
      
      // Save current state to history before updating
      if (gameState) {
        setGameHistory(prev => [...prev.slice(-4), gameState]); // Keep last 5 states
      }
      
      setGameState(data.gameState);
    });

    socketInstance.on('match-found', (data: { roomId: string; gameState: GameState }) => {
      console.log('Match found, setting initial game state:', data.gameState);
      setGameState(data.gameState);
    });

    socketInstance.on('game-ended', (data: { winner: string; reason: string }) => {
      console.log('Game ended:', data);
      
      // Use the stored player ID to determine if we won
      const storedPlayerId = sessionStorage.getItem('playerId');
      const currentGameState = useGameStore.getState().gameState;
      
      let isVictory = false;
      if (currentGameState && storedPlayerId) {
        // Check if our player ID matches the winner
        if (data.winner === 'player1' && currentGameState.players.player1.id === storedPlayerId) {
          isVictory = true;
        } else if (data.winner === 'player2' && currentGameState.players.player2.id === storedPlayerId) {
          isVictory = true;
        }
      }
      
      console.log('Victory check:', { 
        winner: data.winner, 
        storedPlayerId, 
        player1Id: currentGameState?.players?.player1?.id,
        player2Id: currentGameState?.players?.player2?.id,
        isVictory 
      });
      
      setGameEndState({ isVisible: true, isVictory });
    });

    socketInstance.on('action-error', (data: { message: string }) => {
      console.error('Game error:', data.message);
      setError(data.message);
      // Show error to user temporarily
      alert(`Game Error: ${data.message}`);
      setTimeout(() => setError(null), 5000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId, router, setGameState, setPlayerId]);

  const handleCardPlay = (card: Card, targetZone: string, targetIndex?: number) => {
    console.log('DEBUG: handleCardPlay called:', { cardName: card.name, targetZone, isMyTurn: isMyTurn(), hasSocket: !!socket });
    
    if (!socket) {
      console.log('DEBUG: No socket connection');
      return;
    }
    
    if (!isMyTurn() && targetZone !== 'mark_used') {
      console.log('DEBUG: Not my turn, blocking action');
      return;
    }

    let action;

    if (targetZone === 'mark_used') {
      console.log('DEBUG: Creating mark_card_used action for card:', card.name, 'ID:', card.id);
      
      // Immediately update local state for instant feedback
      if (gameState) {
        const myPlayer = getMyPlayer();
        if (myPlayer) {
          // Create a deep copy of gameState
          const updatedGameState = JSON.parse(JSON.stringify(gameState));
          const updatedMyPlayer = updatedGameState.players[myPlayer.id === gameState.players.player1?.id ? 'player1' : 'player2'];
          
          // Update the card in all possible locations
          const updateCardInArray = (array: any[]) => {
            const cardIndex = array.findIndex((c: any) => c.id === card.id);
            if (cardIndex !== -1) {
              array[cardIndex].hasAttacked = !array[cardIndex].hasAttacked;
              console.log('DEBUG: Updated card in array:', array[cardIndex].name, 'hasAttacked:', array[cardIndex].hasAttacked);
              return true;
            }
            return false;
          };
          
          let cardFound = false;
          
          // Update in hand
          if (!cardFound && updatedMyPlayer.hand) {
            cardFound = updateCardInArray(updatedMyPlayer.hand);
          }
          
          // Update in field
          if (!cardFound && updatedMyPlayer.field) {
            cardFound = updateCardInArray(updatedMyPlayer.field);
          }
          
          // Update in fieldMap
          if (!cardFound && updatedMyPlayer.fieldMap) {
            Object.keys(updatedMyPlayer.fieldMap).forEach(pos => {
              const fieldCard = updatedMyPlayer.fieldMap[pos];
              if (fieldCard && fieldCard.id === card.id) {
                fieldCard.hasAttacked = !fieldCard.hasAttacked;
                console.log('DEBUG: Updated card in fieldMap:', fieldCard.name, 'hasAttacked:', fieldCard.hasAttacked);
                cardFound = true;
              }
            });
          }
          
          // Update in supporterZone
          if (!cardFound && updatedMyPlayer.supporterZone) {
            cardFound = updateCardInArray(updatedMyPlayer.supporterZone);
          }
          
          // Update in unitArea
          if (!cardFound && updatedMyPlayer.unitArea) {
            cardFound = updateCardInArray(updatedMyPlayer.unitArea);
          }
          
          if (cardFound) {
            console.log('DEBUG: Local state updated immediately for card:', card.name);
            setGameState(updatedGameState);
          } else {
            console.log('DEBUG: Card not found in any location for local update');
          }
        }
      }
      
      action = {
        type: 'mark_card_used',
        playerId: 0,
        data: {
          cardId: card.id
        }
      };
      console.log('DEBUG: mark_card_used action created:', action);
    } else if (targetZone === 'trash') {
      action = {
        type: 'play',
        playerId: 0,
        data: {
          cardId: card.id,
          targetZone: 'trash'
        }
      };
    } else if (targetZone === 'support') {
      action = {
        type: 'play',
        playerId: 0,
        data: {
          cardId: card.id,
          targetZone: 'support'
        }
      };
    } else if (targetZone === 'unit') {
      action = {
        type: 'play',
        playerId: 0,
        data: {
          cardId: card.id,
          targetZone: 'unit'
        }
      };
    } else {
      action = {
        type: 'play',
        playerId: 0,
        data: {
          cardId: card.id,
          position: targetIndex !== undefined ? 
            [FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT][targetIndex] : 
            undefined,
          targetZone: targetZone
        }
      };
    }

    console.log('Sending play action:', action);
    console.log('Target zone:', targetZone, 'Card:', card.name);
    console.log('Socket connected:', !!socket, 'Action type:', action.type);
    
    // Save current state to history before action
    if (gameState && targetZone !== 'mark_used') {
      setGameHistory(prev => [...prev.slice(-4), gameState]); // Keep last 5 states
    }
    
    socket.emit('game-action', action);
    console.log('Action emitted successfully');
  };

  const handleUndo = () => {
    if (gameHistory.length === 0) {
      alert('戻れる手がありません');
      return;
    }
    
    const previousState = gameHistory[gameHistory.length - 1];
    setGameHistory(prev => prev.slice(0, -1)); // Remove the last state
    setGameState(previousState);
    
    // Optionally send undo action to server (if server supports it)
    // socket.emit('game-action', { type: 'undo', playerId: 0, data: {} });
  };

  const handleReikiMouseDown = (color: string, event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button
      const timer = setTimeout(() => {
        handleUseReiki(color);
      }, 800); // 800ms long press
      setReikiLongPressTimer(timer);
    }
  };

  const handleReikiMouseUp = () => {
    if (reikiLongPressTimer) {
      clearTimeout(reikiLongPressTimer);
      setReikiLongPressTimer(null);
    }
  };

  const handleReikiRightClick = (color: string, event: React.MouseEvent) => {
    event.preventDefault();
    handleUseReiki(color);
  };

  const handleAttack = (attackerIndex: number, targetIndex: number) => {
    if (!socket || !isMyTurn()) return;

    const positions = [FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT];
    const action = {
      type: 'attack',
      playerId: 0, // Will be determined by backend based on socket
      data: {
        attackerId: `attacker-${attackerIndex}`, // This needs to be the actual card ID
        targetPosition: positions[targetIndex]
      }
    };

    console.log('Sending attack action:', action);
    socket.emit('game-action', action);
  };

  const handleEndTurn = () => {
    if (!socket || !isMyTurn()) return;

    // Send multiple end_turn actions to advance through all phases and switch turns
    const action = {
      type: 'end_turn',
      playerId: 0,
      data: {}
    };

    // Send end turn action multiple times to go through all phases
    console.log('Ending turn - switching to opponent');
    for (let i = 0; i < 5; i++) { // Send 5 times to ensure we reach opponent's turn
      socket.emit('game-action', action);
    }
  };

  const handleDrawCard = () => {
    if (!socket || !isMyTurn()) return;

    const action = {
      type: 'draw',
      playerId: 0,
      data: {}
    };

    console.log('Drawing card from deck');
    socket.emit('game-action', action);
  };

  const handleDrawReiki = () => {
    if (!socket || !isMyTurn()) return;

    const action = {
      type: 'use_reiki',
      playerId: 0,
      data: { position: 'LEFT' } // Default position, could be made selectable
    };

    console.log('Drawing reiki card');
    socket.emit('game-action', action);
  };

  const handleUseReiki = (color: string) => {
    if (!socket || !isMyTurn()) return;

    const action = {
      type: 'use_reiki_color',
      playerId: 0,
      data: { color }
    };

    console.log('Using reiki color:', color);
    socket.emit('game-action', action);
  };

  const handleGaugeCardClick = (basePosition: string, cardIndex: number) => {
    if (!socket || !isMyTurn()) return;

    const action = {
      type: 'gauge_to_hand',
      playerId: 0,
      data: { basePosition, cardIndex }
    };

    console.log('Moving gauge card to hand:', basePosition, cardIndex);
    socket.emit('game-action', action);
  };

  const handleBaseClick = (basePosition: string, baseIndex: number) => {
    const { selectedCard, setSelectedCard, selectedFieldSlot, setSelectedFieldSlot } = useGameStore.getState();
    
    if (selectedCard && isMyTurn()) {
      // Play the selected card to this base
      handleCardPlay(selectedCard, 'field', baseIndex);
      setSelectedCard(null); // Deselect after playing
    } else if (selectedFieldSlot !== null && isMyTurn()) {
      // Move unit from selected field slot to this base
      const positions = ['LEFT', 'CENTER', 'RIGHT'];
      const fromPosition = positions[selectedFieldSlot];
      const toPosition = basePosition;
      
      if (fromPosition !== toPosition) {
        const action = {
          type: 'move_unit',
          playerId: 0,
          data: {
            from: fromPosition,
            to: toPosition
          }
        };
        
        console.log('Moving unit:', action);
        socket?.emit('game-action', action);
      }
      
      setSelectedFieldSlot(null); // Deselect after moving
    }
  };

  const handleAreaClick = (areaType: 'support' | 'unit') => {
    const { selectedCard, setSelectedCard } = useGameStore.getState();
    
    if (selectedCard && isMyTurn()) {
      // Play card to support or unit area
      const action = {
        type: 'play',
        playerId: 0,
        data: {
          cardId: selectedCard.id,
          targetZone: areaType
        }
      };
      
      console.log(`Playing card to ${areaType} area:`, action);
      socket?.emit('game-action', action);
      setSelectedCard(null);
    }
  };

  const handleUnitClick = (basePosition: string, baseIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent base click
    
    if (!isMyTurn()) return;
    
    const { selectedFieldSlot, setSelectedFieldSlot } = useGameStore.getState();
    
    if (selectedFieldSlot === baseIndex) {
      // Deselect if clicking the same unit
      setSelectedFieldSlot(null);
    } else {
      // Select this unit for movement
      setSelectedFieldSlot(baseIndex);
    }
  };

  const handleNextPhase = () => {
    if (!socket || !isMyTurn()) return;

    const action = {
      type: 'end_turn', // This will advance to next phase
      playerId: 0,
      data: {}
    };

    console.log('Advancing to next phase:', action);
    socket.emit('game-action', action);
  };

  const handleSendMessage = (message: string) => {
    if (!socket) return;

    socket.emit('send-message', {
      message,
      roomId: roomId as string,
      timestamp: Date.now()
    });
  };

  const handleMarkCardUsed = (card: Card) => {
    if (!socket || !isMyTurn()) return;

    const action = {
      type: 'mark_card_used',
      playerId: 0,
      data: { cardId: card.id }
    };

    console.log('Marking card as used:', action);
    socket.emit('game-action', action);
  };

  const handleSurrender = () => {
    const confirmed = window.confirm('本当に参りましたをしますか？');
    if (confirmed && socket) {
      const action = {
        type: 'surrender',
        playerId: 0,
        data: {}
      };
      
      console.log('Surrendering game:', action);
      socket.emit('game-action', action);
    }
  };

  // ドロップ可能なエリアコンポーネント
  const DroppableArea = ({ targetZone, className, children, onClick }: {
    targetZone: string;
    className: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: 'card',
      drop: (item: { card: Card; index: number }) => {
        console.log('Card dropped:', item.card.name, 'to zone:', targetZone);
        
        if (targetZone === 'support') {
          handleCardPlay(item.card, 'support');
        } else if (targetZone === 'unit') {
          handleCardPlay(item.card, 'unit');
        } else if (targetZone.startsWith('base-')) {
          const baseIndex = parseInt(targetZone.split('-')[1]);
          handleCardPlay(item.card, 'field', baseIndex);
        } else if (targetZone === 'trash') {
          handleCardPlay(item.card, 'trash');
        }
        
        return { dropped: true };
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
      canDrop: (item) => {
        // カードがドロップ可能かチェック
        if (!isMyTurn()) return false;
        
        const card = item.card;
        
        // グレーアウトされたカードは移動できない
        if (card.hasAttacked) return false;
        
        // ゾーンごとのドロップ可能性をチェック
        if (targetZone === 'support') {
          return card.type === 'SUPPORTER' || card.type === 'EVENT';
        } else if (targetZone === 'unit') {
          return card.type === 'UNIT';
        } else if (targetZone.startsWith('base-')) {
          return card.type === 'UNIT';
        } else if (targetZone === 'trash') {
          return true; // どのカードでもトラッシュに送れる
        }
        
        return false;
      },
    });

    const dropZoneClasses = isOver && canDrop 
      ? 'bg-green-200 border-green-400 ring-2 ring-green-500' 
      : isOver 
        ? 'bg-red-200 border-red-400 ring-2 ring-red-500'
        : '';

    return (
      <div
        ref={drop as any}
        className={`${className} ${dropZoneClasses} transition-all duration-200`}
        onClick={onClick}
      >
        {children}
        {isOver && !canDrop && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 text-white font-bold z-10">
            ここには置けません
          </div>
        )}
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">
            {error || (isConnected ? 'Waiting for game to start...' : 'Connecting to server...')}
          </h2>
          {error && (
            <button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const player = getMyPlayer();
  const opponent = getOpponent();
  if (!player) return null;

  return (
    <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
      <Head>
        <title>CNP-TCG - Playing in Room {roomId}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white flex flex-col relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
        </div>
        {/* Header with player info and reiki */}
        <div className="relative z-10 bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-md border-b border-slate-600/50 p-3 flex justify-between items-center text-sm shadow-lg">
          <button 
            onClick={handleUndo}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-slate-500/50"
            disabled={gameHistory.length === 0}
          >
            <span className="flex items-center space-x-1">
              <span>↶</span>
              <span>一手戻る</span>
            </span>
          </button>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span>レイキ:</span>
              <div className="flex space-x-1">
                {(['red', 'blue', 'yellow', 'green'] as const).map((color) => {
                  const total = player?.reikiCounts?.[color] || 0;
                  const used = player?.usedReiki?.[color] || 0;
                  const available = total - used;
                  const colorClasses = {
                    red: 'bg-red-500 hover:bg-red-400',
                    blue: 'bg-blue-500 hover:bg-blue-400',
                    yellow: 'bg-yellow-500 text-black hover:bg-yellow-400',
                    green: 'bg-green-500 hover:bg-green-400'
                  };
                  const colorLabels = {
                    red: '赤',
                    blue: '青',
                    yellow: '黄',
                    green: '緑'
                  };
                  
                  return (
                    <div key={color}>
                      <div 
                        className={`${colorClasses[color]} px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                          color === 'yellow' ? 'text-black' : 'text-white'
                        } border border-opacity-30 ${
                          color === 'red' ? 'border-red-300' : 
                          color === 'blue' ? 'border-blue-300' : 
                          color === 'yellow' ? 'border-yellow-600' : 'border-green-300'
                        }`}
                        onMouseDown={(e) => handleReikiMouseDown(color, e)}
                        onMouseUp={handleReikiMouseUp}
                        onMouseLeave={handleReikiMouseUp}
                        onContextMenu={(e) => handleReikiRightClick(color, e)}
                        title={`右クリック（長押し）で${colorLabels[color]}レイキを使用`}
                      >
                        <span className="flex items-center space-x-1">
                          <span>{colorLabels[color]}</span>
                          <span className="font-bold">{available}/{total}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <span>手札: {player?.hand?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSurrender}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg border border-red-500/50 hover:border-red-400/50"
            >
              <span className="flex items-center space-x-1">
                <span>🏳️</span>
                <span>参りました</span>
              </span>
            </button>
            {isMyTurn() && (
              <button 
                onClick={handleEndTurn}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg border border-blue-500/50 hover:border-blue-400/50 animate-pulse"
              >
                <span className="flex items-center space-x-1">
                  <span>⏭️</span>
                  <span>Turn End</span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="relative z-10 flex-1 flex flex-col backdrop-blur-sm">
          {/* Opponent Area */}
          <div className="p-3 border-b border-slate-600/50 bg-gradient-to-r from-slate-800/30 to-slate-700/30 backdrop-blur-sm">
            <div className="text-xs text-center mb-2">
              <span className="text-red-400 font-semibold">相手: {opponent?.name || 'Unknown'}</span>
            </div>
            <div className="flex justify-center space-x-1">
              <div className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-16 flex flex-col items-center justify-center">
                <span>デッキ</span>
                <span className="text-xs">{opponent?.deck?.length || 0}</span>
              </div>
              <div className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-16 flex flex-col items-center justify-center">
                <span>REIKI</span>
                <span className="text-xs">{opponent?.reikiDeck?.length || 0}</span>
              </div>
              <div className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-48 flex flex-col items-center justify-center">
                <span>サポート</span>
                {(opponent?.supporterZone?.length || 0) > 0 && (
                  <div className="text-xs">{opponent?.supporterZone?.length || 0}</div>
                )}
                <div className="grid grid-cols-3 gap-1 w-full mt-1">
                  {opponent?.supporterZone?.slice(0, 9).map((card, index) => (
                    <div key={card.id} className="text-xs bg-yellow-200 text-black rounded px-1 truncate">
                      {card.name.substring(0, 6)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-80 flex flex-col items-center justify-center">
                <span>ユニット</span>
                {(opponent?.unitArea && Array.isArray(opponent.unitArea)) ? (
                  opponent.unitArea.length > 0 && (
                    <div className="text-xs">{opponent.unitArea.length}</div>
                  )
                ) : null}
                <div className="grid grid-cols-5 gap-1 w-full mt-1">
                  {(opponent?.unitArea && Array.isArray(opponent.unitArea)) ? (
                    opponent.unitArea.slice(0, 15).map((card, index) => (
                      <div key={card.id} className="text-xs bg-blue-200 text-black rounded px-1 truncate">
                        {card.name.substring(0, 6)}
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
              <div className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-16 flex flex-col items-center justify-center">
                <span>トラッシュ</span>
                <span className="text-xs">{opponent?.trash?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Battle Areas (3 bases) */}
          <div className="flex-1 p-2">
            <div className="grid grid-cols-3 gap-1 h-full">
              {['LEFT', 'CENTER', 'RIGHT'].map((basePosition, baseIndex) => (
                <div key={basePosition} className="flex flex-col">
                  {/* Opponent gauge */}
                  <div className="bg-gray-600 rounded p-2 mb-1 text-center text-xs">
                    <div className="text-xs mb-2">相手ゲージ</div>
                    <div className="flex justify-center space-x-1">
                      {opponent?.bases?.[basePosition as keyof typeof opponent.bases]?.gaugeCards?.map((card, cardIndex) => {
                        const opponentColor = getOpponentCardBackColor();
                        const colorClasses = opponentColor === 'blue' 
                          ? 'bg-blue-800 border-blue-600'
                          : 'bg-red-800 border-red-600';
                        
                        return (
                          <div 
                            key={cardIndex} 
                            className={`w-8 h-10 ${colorClasses} rounded border flex items-center justify-center text-white text-xs font-bold`}
                            title="相手のゲージカード"
                          >
                            🃏
                          </div>
                        );
                      }) || [...Array(opponent?.bases?.[basePosition as keyof typeof opponent.bases]?.health || 0)].map((_, i) => {
                        const opponentColor = getOpponentCardBackColor();
                        const colorClasses = opponentColor === 'blue' 
                          ? 'bg-blue-800 border-blue-600'
                          : 'bg-red-800 border-red-600';
                        
                        return (
                          <div 
                            key={i} 
                            className={`w-8 h-10 ${colorClasses} rounded border flex items-center justify-center text-white text-xs font-bold`}
                          >
                            🃏
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Battle field */}
                  <DroppableArea
                    targetZone={`base-${baseIndex}`}
                    className="flex-1 bg-yellow-100 border-2 border-yellow-400 rounded p-2 min-h-[120px] flex flex-col justify-center items-center text-black text-xs cursor-pointer hover:bg-yellow-200"
                    onClick={() => handleBaseClick(basePosition, baseIndex)}
                  >
                    <span>拠点 {baseIndex + 1}</span>
                    {/* Display units if any */}
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      {/* All cards for this base position */}
                      {(() => {
                        const baseCards: Card[] = [];
                        
                        // Add main card from fieldMap if exists
                        if (player?.fieldMap?.[basePosition as keyof typeof player.fieldMap]) {
                          const mainCard = player.fieldMap[basePosition as keyof typeof player.fieldMap];
                          if (mainCard) baseCards.push(mainCard);
                        }
                        
                        // Add all field cards that have this fieldPosition or are unaccounted for
                        if (player?.field && Array.isArray(player.field)) {
                          (player.field as Card[]).forEach((card: Card) => {
                            // Skip if already in baseCards
                            if (baseCards.find(bc => bc.id === card.id)) return;
                            
                            // Include if has matching fieldPosition
                            if (card.fieldPosition === basePosition) {
                              baseCards.push(card);
                            }
                            // Include if no fieldPosition and not in other zones
                            else if (!card.fieldPosition && 
                              !Object.values(player.fieldMap || {}).includes(card) &&
                              !(player.unitArea && player.unitArea.includes(card)) &&
                              !(player.supporterZone && player.supporterZone.includes(card))) {
                              // Only add one unaccounted card per base to avoid duplication
                              if (baseIndex === 0) { // Only add to first base
                                baseCards.push(card);
                              }
                            }
                          });
                        }
                        
                        console.log(`DEBUG: Base ${basePosition} has ${baseCards.length} cards:`, baseCards.map(c => `${c.name}(hasAttacked:${c.hasAttacked})`));
                        
                        return baseCards.slice(0, 4).map((card, index) => (
                          <FieldCard
                            key={card.id}
                            card={card}
                            onCardAction={handleCardPlay}
                            className={`${index === 0 ? '' : 'scale-90'} ${
                              useGameStore.getState().selectedFieldSlot === baseIndex 
                                ? 'border-blue-600 border-2 scale-105' 
                                : ''
                            }`}
                          />
                        ));
                      })()}
                    </div>
                    {/* Opponent cards in this base */}
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      {(() => {
                        const opponentBaseCards: Card[] = [];
                        
                        // Add main card from fieldMap if exists
                        if (opponent?.fieldMap?.[basePosition as keyof typeof opponent.fieldMap]) {
                          const mainCard = opponent.fieldMap[basePosition as keyof typeof opponent.fieldMap];
                          if (mainCard) opponentBaseCards.push(mainCard);
                        }
                        
                        // Add all field cards that have this fieldPosition or are unaccounted for
                        if (opponent?.field && Array.isArray(opponent.field)) {
                          (opponent.field as Card[]).forEach((card: Card) => {
                            // Skip if already in opponentBaseCards
                            if (opponentBaseCards.find(bc => bc.id === card.id)) return;
                            
                            // Include if has matching fieldPosition
                            if (card.fieldPosition === basePosition) {
                              opponentBaseCards.push(card);
                            }
                            // Include if no fieldPosition and not in other zones
                            else if (!card.fieldPosition && 
                              !Object.values(opponent.fieldMap || {}).includes(card) &&
                              !(opponent.unitArea && opponent.unitArea.includes(card)) &&
                              !(opponent.supporterZone && opponent.supporterZone.includes(card))) {
                              // Only add one unaccounted card per base to avoid duplication
                              if (baseIndex === 0) { // Only add to first base
                                opponentBaseCards.push(card);
                              }
                            }
                          });
                        }
                        
                        console.log(`DEBUG: Opponent Base ${basePosition} has ${opponentBaseCards.length} cards:`, opponentBaseCards.map(c => c.name));
                        
                        return opponentBaseCards.slice(0, 4).map((card, index) => {
                          const opponentColor = getOpponentCardBackColor();
                          const colorClasses = opponentColor === 'blue' 
                            ? (card.hasAttacked ? 'bg-gray-400 opacity-60' : 'bg-blue-500 border-blue-300')
                            : (card.hasAttacked ? 'bg-gray-400 opacity-60' : 'bg-red-500 border-red-300');
                          
                          return (
                            <div
                              key={card.id}
                              className={`w-12 h-16 rounded border text-xs p-1 text-white ${colorClasses} ${index === 0 ? '' : 'scale-90'}`}
                            >
                              <div className="text-center">
                                <div className="font-bold text-xs">{card.cost}</div>
                                <div className="text-xs truncate">{card.name.substring(0, 6)}</div>
                                <div className="text-xs">{card.bp || card.attack}/{card.sp || card.defense}</div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </DroppableArea>
                  
                  {/* Player gauge */}
                  <div className="bg-gray-600 rounded p-2 mt-1 text-center text-xs">
                    <div className="flex justify-center space-x-1 mb-2">
                      {player?.bases?.[basePosition as keyof typeof player.bases]?.gaugeCards?.map((card, cardIndex) => {
                        const playerColor = getPlayerCardBackColor();
                        const colorClasses = playerColor === 'blue' 
                          ? 'bg-gradient-to-b from-blue-800 to-blue-900 border-blue-600 hover:from-blue-700 hover:to-blue-800'
                          : 'bg-gradient-to-b from-red-800 to-red-900 border-red-600 hover:from-red-700 hover:to-red-800';
                        
                        return (
                          <div 
                            key={cardIndex} 
                            className={`w-10 h-12 ${colorClasses} rounded flex items-center justify-center text-white text-xs font-bold cursor-pointer transform hover:scale-105 transition-all shadow-lg`}
                            onClick={() => handleGaugeCardClick(basePosition, cardIndex)}
                            title="ゲージカード - クリックで手札に移動"
                          >
                            🃏
                          </div>
                        );
                      }) || [...Array(player?.bases?.[basePosition as keyof typeof player.bases]?.health || 0)].map((_, i) => {
                        const playerColor = getPlayerCardBackColor();
                        const colorClasses = playerColor === 'blue' 
                          ? 'bg-gradient-to-b from-blue-800 to-blue-900 border-blue-600 hover:from-blue-700 hover:to-blue-800'
                          : 'bg-gradient-to-b from-red-800 to-red-900 border-red-600 hover:from-red-700 hover:to-red-800';
                        
                        return (
                          <div 
                            key={i} 
                            className={`w-10 h-12 ${colorClasses} rounded flex items-center justify-center text-white text-xs font-bold cursor-pointer transform hover:scale-105 transition-all shadow-lg`}
                            onClick={() => handleGaugeCardClick(basePosition, i)}
                            title="ゲージカード - クリックで手札に移動"
                          >
                            🃏
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs">自ゲージ</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Player Area */}
          <div className="p-2 border-t border-gray-600">
            <div className="flex justify-center space-x-1 mb-2">
              <div 
                className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-500"
                onClick={handleDrawCard}
              >
                <span>デッキ</span>
                <span className="text-xs">{player?.deck?.length || 0}</span>
              </div>
              <div 
                className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-500"
                onClick={handleDrawReiki}
              >
                <span>REIKI</span>
                <span className="text-xs">{player?.reikiDeck?.length || 0}</span>
              </div>
              <DroppableArea
                targetZone="support"
                className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-48 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-500"
                onClick={() => handleAreaClick('support')}
              >
                <span>サポート</span>
                {player?.supporterZone?.length > 0 && (
                  <div className="text-xs">{player.supporterZone.length}</div>
                )}
                <div className="grid grid-cols-3 gap-1 w-full mt-1">
                  {player?.supporterZone?.slice(0, 9).map((card, index) => (
                    <FieldCard
                      key={card.id}
                      card={card}
                      onCardAction={handleCardPlay}
                      className="text-xs"
                    />
                  ))}
                </div>
              </DroppableArea>
              <DroppableArea
                targetZone="unit"
                className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-80 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-500"
                onClick={() => handleAreaClick('unit')}
              >
                <span>ユニット</span>
                {(player?.unitArea && Array.isArray(player.unitArea)) ? (
                  player.unitArea.length > 0 && (
                    <div className="text-xs">{player.unitArea.length}</div>
                  )
                ) : null}
                <div className="grid grid-cols-5 gap-1 w-full mt-1">
                  {(player?.unitArea && Array.isArray(player.unitArea)) ? (
                    player.unitArea.slice(0, 15).map((card, index) => (
                      <FieldCard
                        key={card.id}
                        card={card}
                        onCardAction={handleCardPlay}
                        className="text-xs"
                      />
                    ))
                  ) : null}
                </div>
              </DroppableArea>
              <DroppableArea
                targetZone="trash"
                className="bg-gray-600 rounded p-2 text-xs min-h-[60px] w-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-500"
              >
                <span>トラッシュ</span>
                <span className="text-xs">
                  {(() => {
                    const trashCount = player?.trash?.length || 0;
                    console.log('DEBUG: Rendering trash count:', trashCount);
                    return trashCount;
                  })()}
                </span>
              </DroppableArea>
            </div>
            <div className="text-xs text-center">
              <span className="text-blue-400 font-semibold">自分: {player?.name || 'Unknown'}</span>
            </div>
          </div>

          {/* Hand */}
          <div className="p-2 bg-gray-700">
            <PlayerHand onCardPlay={handleCardPlay} onMarkCardUsed={handleMarkCardUsed} />
            {/* Selection status */}
            <div className="text-center text-xs mt-2">
              {useGameStore.getState().selectedFieldSlot !== null && (
                <div className="text-yellow-300">
                  ユニットを選択中 - 移動先の拠点をタップ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat (minimized by default) */}
        <div className="bg-gray-700 border-t border-gray-600">
          <Chat 
            roomId={roomId as string}
            onSendMessage={handleSendMessage}
            socket={socket}
          />
        </div>

        {/* Game End Animation */}
        {gameEndState && (
          <GameEndAnimation 
            isVisible={gameEndState.isVisible}
            isVictory={gameEndState.isVictory}
            onAnimationEnd={() => setGameEndState(null)}
            onRematch={() => {
              router.push('/match');
            }}
            onGoHome={() => {
              router.push('/');
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}