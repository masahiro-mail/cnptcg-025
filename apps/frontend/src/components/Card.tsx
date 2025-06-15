import React from 'react';
import { Card as CardType, CardType as CardTypeEnum, Attribute } from '@cnp-tcg/common-types';
import clsx from 'clsx';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  isInHand?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  card,
  isDraggable = false,
  isInHand = false,
  className,
}) => {

  const attributeColors = {
    [Attribute.BLUE]: styles.attributeBlue,
    [Attribute.RED]: styles.attributeRed,
    [Attribute.YELLOW]: styles.attributeYellow,
    [Attribute.GREEN]: styles.attributeGreen,
    [Attribute.REIKI]: styles.attributeReiki || styles.attributeBlue,
  };

  const cardTypeLabels = {
    [CardTypeEnum.UNIT]: 'UNIT',
    [CardTypeEnum.EVENT]: 'EVENT',
    [CardTypeEnum.SUPPORTER]: 'SUPPORTER',
  };

  return (
    <div
      className={clsx(
        styles.card,
        attributeColors[card.attribute],
        {
          [styles.draggable]: isDraggable,
          [styles.inHand]: isInHand,
        },
        className
      )}
    >
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <span className={styles.cardCost}>{card.cost}</span>
        <span className={styles.cardName}>{card.name}</span>
      </div>

      {/* Card Art (placeholder) */}
      <div className={styles.cardArt}>
        {card.artUrl ? (
          <img src={card.artUrl} alt={card.name} />
        ) : (
          <div className={styles.artPlaceholder}>
            {card.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Card Type */}
      <div className={styles.cardType}>
        {cardTypeLabels[card.type]}
      </div>

      {/* Card Text */}
      <div className={styles.cardText}>
        {card.text}
      </div>

      {/* Unit Stats */}
      {card.type === CardTypeEnum.UNIT && (
        <div className={styles.unitStats}>
          <div className={styles.bp}>
            <span className={styles.statLabel}>BP</span>
            <span className={styles.statValue}>{card.bp}</span>
          </div>
          <div className={styles.sp}>
            <span className={styles.statLabel}>SP</span>
            <span className={styles.statValue}>{card.sp}</span>
          </div>
        </div>
      )}

      {/* Flavor Text */}
      {card.flavorText && (
        <div className={styles.flavorText}>
          {card.flavorText}
        </div>
      )}
    </div>
  );
};

export default Card;