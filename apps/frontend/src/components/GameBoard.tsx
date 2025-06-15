import React from 'react';
import { useDrop } from 'react-dnd';
import { useGameStore } from '../store/gameStore';
import FieldSlotComponent from './FieldSlot';
import { Card, FieldPosition } from '@cnp-tcg/common-types';
import styles from './Board.module.css';

interface GameBoardProps {
  onCardPlay: (card: Card, targetZone: string, targetIndex?: number) => void;
  onAttack: (attackerIndex: number, targetIndex: number) => void;
}

export default function GameBoard({ onCardPlay, onAttack }: GameBoardProps) {
  const { gameState, selectedCard, isMyTurn, getMyPlayer, getOpponent } = useGameStore();
  
  if (!gameState) return null;
  
  const player = getMyPlayer();
  const opponent = getOpponent();
  
  if (!player || !opponent) return null;
  
  const playerField = player.field;
  const opponentField = opponent.field;

  const [{ isOver: isFieldOver }, fieldDrop] = useDrop({
    accept: 'card',
    drop: (item: { card: Card }) => {
      // Default to first available slot
      const positions = [FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT];
      const availablePos = positions.find(pos => {
        // Check if field is object format and position is empty
        return !Array.isArray(playerField) && !playerField[pos];
      });
      if (availablePos) {
        const index = positions.indexOf(availablePos);
        onCardPlay(item.card, 'field', index);
      }
    },
    canDrop: () => isMyTurn(),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const handleSlotClick = (isPlayerSlot: boolean, index: number) => {
    if (!isMyTurn()) return;

    if (selectedCard) {
      // Playing a card from hand
      if (isPlayerSlot) {
        onCardPlay(selectedCard, 'field', index);
      }
    } else if (!isPlayerSlot) {
      // Attacking with a unit - find first unit that can attack
      if (!Array.isArray(playerField)) {
        const positions = [FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT];
        const attackerPos = positions.find(pos => {
          const unit = playerField[pos];
          return unit && unit.canAttack;
        });
        if (attackerPos) {
          const attackerIndex = positions.indexOf(attackerPos);
          onAttack(attackerIndex, index);
        }
      }
    }
  };

  return (
    <div className={styles.board} ref={fieldDrop as any}>
      {/* Opponent's Field */}
      <div className={styles.opponentField}>
        <div className={styles.fieldLabel}>Opponent&apos;s Field</div>
        <div className={styles.fieldSlots}>
          {[FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT].map((position, index) => (
            <FieldSlotComponent
              key={`opponent-${position}`}
              card={Array.isArray(opponentField) ? null : opponentField[position]}
              position={position}
              isOpponent={true}
              isDroppable={false}
              onDrop={() => {}}
            />
          ))}
        </div>
      </div>

      {/* Battle Line */}
      <div className={styles.battleLine}>
        <div className={styles.battleLineText}>Battle Line</div>
      </div>

      {/* Player's Field */}
      <div className={styles.playerField}>
        <div className={styles.fieldSlots}>
          {[FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT].map((position, index) => (
            <FieldSlotComponent
              key={`player-${position}`}
              card={Array.isArray(playerField) ? null : playerField[position]}
              position={position}
              isOpponent={false}
              isDroppable={!Array.isArray(playerField) && !playerField[position] && isMyTurn()}
              onDrop={(cardId: string) => {
                const card = selectedCard || (player.hand.find((c: any) => c.id === cardId) as Card);
                if (card) {
                  onCardPlay(card, 'field', index);
                }
              }}
            />
          ))}
        </div>
        <div className={styles.fieldLabel}>Your Field</div>
      </div>

      {/* Drop indicator */}
      {isFieldOver && isMyTurn() && (
        <div className={styles.dropIndicator}>Drop card here</div>
      )}
    </div>
  );
}