import React from 'react';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';
import styles from './GameInfo.module.css';

interface GameInfoProps {
  onEndTurn: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ onEndTurn }) => {
  const { gameState, isMyTurn, getMyPlayer, getOpponent } = useGameStore();
  
  if (!gameState) return null;
  
  const player = getMyPlayer();
  const opponent = getOpponent();
  
  if (!player || !opponent) return null;
  
  const isLocalPlayerTurn = isMyTurn();

  return (
    <div className={styles.gameInfo}>
      <div className={styles.turnInfo}>
        <div className={styles.turnNumber}>Turn {gameState.turn}</div>
        <div className={clsx(styles.turnIndicator, {
          [styles.yourTurn]: isLocalPlayerTurn,
        })}>
          {isLocalPlayerTurn ? 'Your Turn' : "Opponent's Turn"}
        </div>
      </div>

      <div className={styles.players}>
        <div className={clsx(styles.playerInfo, {
          [styles.active]: isLocalPlayerTurn,
        })}>
          <div className={styles.playerName}>
            {player.name} (You)
          </div>
          <div className={styles.playerStats}>
            <span>Hand: {player.hand?.length || 0}</span>
            <span>Deck: {player.deck?.length || 0}</span>
            <span>Mana: {player.mana || 0}/{player.maxMana || 0}</span>
          </div>
        </div>

        <div className={styles.vs}>VS</div>

        <div className={clsx(styles.playerInfo, {
          [styles.active]: !isLocalPlayerTurn,
        })}>
          <div className={styles.playerName}>
            {opponent.name}
          </div>
          <div className={styles.playerStats}>
            <span>Hand: {opponent.hand?.length || 0}</span>
            <span>Deck: {opponent.deck?.length || 0}</span>
          </div>
        </div>
      </div>
      
      {isLocalPlayerTurn && (
        <div className={styles.actions}>
          <button 
            onClick={onEndTurn}
            className={styles.endTurnButton}
          >
            End Turn
          </button>
        </div>
      )}
    </div>
  );
};

export default GameInfo;