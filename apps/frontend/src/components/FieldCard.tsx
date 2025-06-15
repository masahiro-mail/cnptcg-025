import React, { useState, useEffect } from 'react';
import { Card as CardType } from '@cnp-tcg/common-types';
import CardActionMenu from './CardActionMenu';
import { useGameStore } from '../store/gameStore';

interface FieldCardProps {
  card: CardType;
  onCardAction: (card: CardType, action: string, targetIndex?: number) => void;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function FieldCard({ card, onCardAction, className }: FieldCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [clickTimer] = useState<NodeJS.Timeout | null>(null);
  const { gameState, getMyPlayer } = useGameStore();

  // Determine player color (first player = blue, second player = red)
  const getPlayerCardColor = () => {
    const player = getMyPlayer();
    if (!player || !gameState) return 'blue';
    
    // player1 is first player (blue), player2 is second player (red)
    const isFirstPlayer = gameState.players.player1.id === player.id;
    return isFirstPlayer ? 'blue' : 'red';
  };

  const playerColor = getPlayerCardColor();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [clickTimer]);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('DEBUG: FieldCard clicked:', card.name, 'Current menu state:', showMenu, 'hasAttacked:', card.hasAttacked);
    
    // Check if card is grayed out (used) - prevent movement but allow menu
    if (card.hasAttacked) {
      console.log('DEBUG: Card is grayed out, preventing movement actions');
      // Still show menu but limit available actions
      setShowMenu(true);
      return;
    }
    
    // Always show menu on single click for field cards
    setShowMenu(true);
    
    console.log('DEBUG: Menu should now be visible for:', card.name);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('DEBUG: FieldCard right-clicked:', card.name, 'Current hasAttacked:', card.hasAttacked, 'Card ID:', card.id);
    console.log('DEBUG: onCardAction function:', typeof onCardAction);
    
    // Toggle grayout state by calling mark_card_used action
    onCardAction(card, 'mark_used');
    
    console.log('DEBUG: mark_used action called for card:', card.name);
  };

  const handleTrashCard = () => {
    if (card.hasAttacked) {
      console.log('DEBUG: Cannot move grayed out card to trash');
      setShowMenu(false);
      return;
    }
    onCardAction(card, 'trash');
    setShowMenu(false);
  };

  const handleMoveToSupport = () => {
    if (card.hasAttacked) {
      console.log('DEBUG: Cannot move grayed out card to support');
      setShowMenu(false);
      return;
    }
    onCardAction(card, 'support');
    setShowMenu(false);
  };

  const handleMoveToUnit = () => {
    if (card.hasAttacked) {
      console.log('DEBUG: Cannot move grayed out card to unit');
      setShowMenu(false);
      return;
    }
    onCardAction(card, 'unit');
    setShowMenu(false);
  };

  const handleMoveToBase = (baseIndex: number) => {
    if (card.hasAttacked) {
      console.log('DEBUG: Cannot move grayed out card to base');
      setShowMenu(false);
      return;
    }
    onCardAction(card, 'field', baseIndex);
    setShowMenu(false);
  };

  return (
    <>
      <div 
        className={`group relative w-16 h-20 rounded-lg p-1 cursor-pointer transition-all duration-300 hover:scale-110 text-white transform-gpu ${
          card.hasAttacked 
            ? 'bg-gradient-to-br from-gray-600 to-gray-800 opacity-60 shadow-md' 
            : playerColor === 'blue'
              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 border border-blue-400/50 shadow-lg shadow-blue-500/25'
              : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-400 hover:via-red-500 hover:to-red-600 border border-red-400/50 shadow-lg shadow-red-500/25'
        } ${className || ''} hover:shadow-xl backdrop-blur-sm`}
        onClick={handleCardClick}
        onContextMenu={handleRightClick}
      >
        {/* Card shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
        
        {/* Card border glow */}
        {!card.hasAttacked && (
          <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            playerColor === 'blue' 
              ? 'shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
              : 'shadow-[0_0_20px_rgba(239,68,68,0.5)]'
          }`}></div>
        )}
        
        <div className="relative z-10 text-center h-full flex flex-col justify-between">
          {/* Cost badge */}
          <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
            card.hasAttacked 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-yellow-400 text-yellow-900 shadow-sm'
          }`}>
            {card.cost}
          </div>
          
          {/* Card name */}
          <div className="text-xs font-semibold truncate px-1 leading-tight">
            {card.name}
          </div>
          
          {/* Stats */}
          <div className={`text-xs font-bold ${
            card.hasAttacked ? 'text-gray-300' : 'text-white'
          }`}>
            {card.bp || card.attack}/{card.sp || card.defense}
          </div>
        </div>
        
        {/* Used/attacked overlay */}
        {card.hasAttacked && (
          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
            <span className="text-white/70 text-xs font-bold">USED</span>
          </div>
        )}
      </div>
      
      <CardActionMenu
        card={card}
        isVisible={showMenu}
        onClose={() => setShowMenu(false)}
        onTrashCard={handleTrashCard}
        onMoveToSupport={handleMoveToSupport}
        onMoveToUnit={handleMoveToUnit}
        onMoveToBase={handleMoveToBase}
      />
    </>
  );
}