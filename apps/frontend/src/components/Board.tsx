import React from 'react';
import { FieldPosition, PlayerState } from '@cnp-tcg/common-types';
import FieldSlot from './FieldSlot';
import Gauge from './Gauge';
import styles from './Board.module.css';

interface BoardProps {
  playerState: PlayerState;
  opponentState: PlayerState;
  isPlayerTurn: boolean;
  onFieldDrop: (cardId: string, position: FieldPosition) => void;
}

const Board: React.FC<BoardProps> = ({
  playerState,
  opponentState,
  isPlayerTurn,
  onFieldDrop,
}) => {
  const positions = [FieldPosition.LEFT, FieldPosition.CENTER, FieldPosition.RIGHT];

  return (
    <div className={styles.board}>
      {/* Opponent's field */}
      <div className={styles.opponentField}>
        <div className={styles.playerLabel}>
          {opponentState.name}
        </div>
        <div className={styles.fieldRow}>
          {positions.map((position) => (
            <div key={`opponent-${position}`} className={styles.fieldColumn}>
              <Gauge
                current={opponentState.gauges[position]}
                max={5}
                position={position}
                isOpponent={true}
              />
              <FieldSlot
                card={Array.isArray(opponentState.field) ? null : opponentState.field[position]}
                position={position}
                isOpponent={true}
                isDroppable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Battle line separator */}
      <div className={styles.battleLine}>
        <div className={styles.battleLineText}>BATTLE LINE</div>
      </div>

      {/* Player's field */}
      <div className={styles.playerField}>
        <div className={styles.fieldRow}>
          {positions.map((position) => (
            <div key={`player-${position}`} className={styles.fieldColumn}>
              <FieldSlot
                card={Array.isArray(playerState.field) ? null : playerState.field[position]}
                position={position}
                isOpponent={false}
                isDroppable={isPlayerTurn}
                onDrop={(cardId) => onFieldDrop(cardId, position)}
              />
              <Gauge
                current={playerState.gauges[position]}
                max={5}
                position={position}
                isOpponent={false}
              />
            </div>
          ))}
        </div>
        <div className={styles.playerLabel}>
          {playerState.name} {isPlayerTurn && <span className={styles.turnIndicator}>YOUR TURN</span>}
        </div>
      </div>
    </div>
  );
};

export default Board;