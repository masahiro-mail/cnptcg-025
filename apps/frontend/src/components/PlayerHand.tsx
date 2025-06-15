import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { useGameStore } from '../store/gameStore';
import Card from './Card';
import CardModal from './CardModal';
import CardActionMenu from './CardActionMenu';
import { Card as CardType } from '@cnp-tcg/common-types';
import styles from './Hand.module.css';

interface PlayerHandProps {
  onCardPlay: (card: CardType, targetZone: string, targetIndex?: number) => void;
  onMarkCardUsed?: (card: CardType) => void;
}

interface DraggableCardProps {
  card: CardType;
  index: number;
  canPlay: boolean;
  className: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
}

function DraggableCard({ 
  card, 
  index, 
  canPlay, 
  className, 
  style, 
  onClick, 
  onContextMenu, 
  onMouseDown, 
  onMouseUp, 
  onMouseLeave 
}: DraggableCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { card, index },
    canDrag: canPlay && !card.hasAttacked, // Prevent dragging grayed out cards
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        console.log('Card was not dropped on a valid target');
      }
    },
  });

  return (
    <div
      ref={drag as any}
      className={`${className} ${isDragging ? 'opacity-50' : ''}`}
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative z-10 text-white text-center h-full flex flex-col justify-between">
        {/* Card shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
        
        {/* Cost badge */}
        <div className="inline-flex items-center justify-center w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold shadow-sm">
          {card.cost}
        </div>
        
        {/* Card name */}
        <div className="text-xs font-semibold truncate px-1 leading-tight">
          {card.name}
        </div>
        
        {/* Stats */}
        <div className="text-xs font-bold">
          {card.bp || card.attack}/{card.sp || card.defense}
        </div>
      </div>
    </div>
  );
}

export default function PlayerHand({ onCardPlay, onMarkCardUsed }: PlayerHandProps) {
  const { gameState, isMyTurn, getMyPlayer, canPlayCard, selectedCard, setSelectedCard } = useGameStore();
  const [modalCard, setModalCard] = useState<CardType | null>(null);
  const [menuCard, setMenuCard] = useState<CardType | null>(null);
  
  const player = getMyPlayer();
  const playerHand = player?.hand || [];
  const currentPhase = gameState?.phase;

  const canPlay = (card: CardType) => {
    return isMyTurn() && canPlayCard(card) && !card.hasAttacked;
  };
  
  const isCardUsed = (card: CardType) => {
    return card.hasAttacked || false;
  };

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [doubleClickTimer, setDoubleClickTimer] = useState<NodeJS.Timeout | null>(null);

  const handleCardClick = (card: CardType, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Handle double click for modal
    if (event.detail === 2) {
      if (doubleClickTimer) {
        clearTimeout(doubleClickTimer);
        setDoubleClickTimer(null);
      }
      setModalCard(card);
      return;
    }
    
    // Single click - show menu with delay to allow for double click
    const timer = setTimeout(() => {
      setMenuCard(card);
    }, 200);
    
    setDoubleClickTimer(timer);
  };

  const handleCardRightClick = (card: CardType, event: React.MouseEvent) => {
    event.preventDefault();
    markCardAsUsed(card);
  };

  const handleMouseDown = (card: CardType, event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button
      const timer = setTimeout(() => {
        markCardAsUsed(card);
      }, 800); // 800ms long press
      setLongPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const markCardAsUsed = (card: CardType) => {
    if (!isMyTurn()) return;
    
    // Use onCardPlay with 'mark_used' action instead
    onCardPlay(card, 'mark_used');
  };

  const handleTrashCard = () => {
    if (menuCard) {
      onCardPlay(menuCard, 'trash');
      setMenuCard(null);
    }
  };

  const handleMoveToSupport = () => {
    if (menuCard) {
      onCardPlay(menuCard, 'support');
      setMenuCard(null);
    }
  };

  const handleMoveToUnit = () => {
    if (menuCard) {
      onCardPlay(menuCard, 'unit');
      setMenuCard(null);
    }
  };

  const handleMoveToBase = (baseIndex: number) => {
    if (menuCard) {
      onCardPlay(menuCard, 'field', baseIndex);
      setMenuCard(null);
    }
  };

  return (
    <div className="w-full">
      <div className="relative h-20 overflow-visible">
        {playerHand.length === 0 ? (
          <div className="text-gray-400 text-xs text-center w-full">No cards in hand</div>
        ) : (() => {
          // カードの表示幅を計算（1枚あたり64px + 余白4px = 68px）
          const cardWidth = 68;
          // 利用可能な画面幅に基づいて動的にコンテナ幅を計算
          const availableWidth = typeof window !== 'undefined' ? 
            Math.min(window.innerWidth - 100, 600) : 500; // 左右のマージンを考慮
          const maxCardsInRow = Math.floor(availableWidth / cardWidth);
          
          console.log('Hand display:', { 
            handLength: playerHand.length, 
            maxCardsInRow, 
            availableWidth,
            shouldOverlap: playerHand.length > maxCardsInRow 
          });
          
          if (playerHand.length <= maxCardsInRow) {
            // 重ならずに並べられる場合
            return (
              <div className="flex justify-center space-x-1">
                {playerHand.map((card, index) => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    index={index}
                    canPlay={canPlay(card)}
                    className={`group relative w-16 h-20 rounded-lg border text-xs p-1 cursor-pointer transition-all duration-300 hover:scale-110 transform-gpu ${
                      selectedCard?.id === card.id 
                        ? 'bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 border-cyan-400 scale-105 shadow-lg shadow-cyan-500/50' 
                        : isCardUsed(card)
                          ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 opacity-40 grayscale shadow-md'
                          : canPlay(card) 
                            ? 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 border-slate-500 hover:border-slate-400 shadow-lg hover:shadow-slate-500/25' 
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 opacity-50 shadow-md'
                    } hover:shadow-xl backdrop-blur-sm`}
                    onClick={(e) => handleCardClick(card, e)}
                    onContextMenu={(e) => handleCardRightClick(card, e)}
                    onMouseDown={(e) => handleMouseDown(card, e)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                ))}
              </div>
            );
          } else {
            // 重ねて表示する場合
            return (
              <div className="flex justify-center">
                {playerHand.map((card, index) => {
                  const totalCards = playerHand.length;
                  const maxSpread = Math.min(320, (totalCards - 1) * 10);
                  const leftOffset = totalCards > 1 ? (index * maxSpread) / (totalCards - 1) - maxSpread / 2 : 0;
                  
                  return (
                    <DraggableCard
                      key={card.id}
                      card={card}
                      index={index}
                      canPlay={canPlay(card)}
                      className={`group absolute w-16 h-20 rounded-lg border text-xs p-1 cursor-pointer transition-all duration-300 hover:z-10 hover:scale-110 transform-gpu ${
                        selectedCard?.id === card.id 
                          ? 'bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 border-cyan-400 z-20 scale-105 shadow-lg shadow-cyan-500/50' 
                          : isCardUsed(card)
                            ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 opacity-40 grayscale shadow-md'
                            : canPlay(card) 
                              ? 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 border-slate-500 hover:border-slate-400 shadow-lg hover:shadow-slate-500/25' 
                              : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 opacity-50 shadow-md'
                      } hover:shadow-xl backdrop-blur-sm`}
                      style={{
                        left: `calc(50% + ${leftOffset}px)`,
                        transform: 'translateX(-50%)',
                        zIndex: selectedCard?.id === card.id ? 20 : (10 + index)
                      }}
                      onClick={(e) => handleCardClick(card, e)}
                      onContextMenu={(e) => handleCardRightClick(card, e)}
                      onMouseDown={(e) => handleMouseDown(card, e)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                  );
                })}
              </div>
            );
          }
        })()}
      </div>
      {selectedCard && (
        <div className="text-xs text-center text-yellow-300 mt-1">
          「{selectedCard.name}」を選択中 - 配置したい拠点をタップ
        </div>
      )}
      
      <CardModal 
        card={modalCard}
        isOpen={modalCard !== null}
        onClose={() => setModalCard(null)}
      />
      
      <CardActionMenu
        card={menuCard}
        isVisible={menuCard !== null}
        onClose={() => setMenuCard(null)}
        onTrashCard={handleTrashCard}
        onMoveToSupport={handleMoveToSupport}
        onMoveToUnit={handleMoveToUnit}
        onMoveToBase={handleMoveToBase}
      />
    </div>
  );
}