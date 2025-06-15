import React from 'react';
import { Card as CardType } from '@cnp-tcg/common-types';
import Card from './Card';
import styles from './Hand.module.css';

interface HandProps {
  cards: CardType[];
  isPlayerTurn: boolean;
}

const Hand: React.FC<HandProps> = ({ cards, isPlayerTurn }) => {
  return (
    <div className={styles.hand}>
      <div className={styles.handLabel}>
        Hand ({cards.length} cards)
      </div>
      <div className={styles.handCards}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={styles.cardWrapper}
            style={{
              zIndex: index,
              transform: `translateX(${index * 30}px)`,
            }}
          >
            <Card
              card={card}
              isDraggable={isPlayerTurn}
              isInHand={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hand;