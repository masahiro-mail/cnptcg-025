import React from 'react';
import { useDrop } from 'react-dnd';
import { Card as CardType, FieldPosition } from '@cnp-tcg/common-types';
import Card from './Card';
import clsx from 'clsx';
import styles from './FieldSlot.module.css';

interface FieldSlotProps {
  card: CardType | null;
  position: FieldPosition;
  isOpponent: boolean;
  isDroppable: boolean;
  onDrop?: (cardId: string) => void;
}

const FieldSlot: React.FC<FieldSlotProps> = ({
  card,
  position,
  isOpponent,
  isDroppable,
  onDrop,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'card',
    canDrop: () => isDroppable && !card,
    drop: (item: { cardId: string }) => {
      if (onDrop) {
        onDrop(item.cardId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  });

  const positionLabels = {
    [FieldPosition.LEFT]: 'LEFT',
    [FieldPosition.CENTER]: 'CENTER',
    [FieldPosition.RIGHT]: 'RIGHT',
  };

  return (
    <div
      ref={drop as any}
      className={clsx(styles.fieldSlot, {
        [styles.opponent]: isOpponent,
        [styles.droppable]: isDroppable && !card,
        [styles.dragOver]: isOver,
        [styles.occupied]: !!card,
      })}
    >
      <div className={styles.positionLabel}>
        {positionLabels[position]}
      </div>
      
      {card ? (
        <Card card={card} isDraggable={false} />
      ) : (
        <div className={styles.emptySlot}>
          <div className={styles.slotPlaceholder}>
            {isDroppable ? 'Drop Unit Here' : 'Empty'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldSlot;