import React from 'react';
import { Phase } from '@cnp-tcg/common-types';
import clsx from 'clsx';
import styles from './PhaseIndicator.module.css';

interface PhaseIndicatorProps {
  currentPhase: Phase;
  isPlayerTurn: boolean;
  onEndPhase: () => void;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  currentPhase,
  isPlayerTurn,
  onEndPhase,
}) => {
  const phases = [
    { key: Phase.DRAW, label: 'Draw' },
    { key: Phase.REIKI, label: 'Reiki' },
    { key: Phase.MAIN, label: 'Main' },
    { key: Phase.BATTLE, label: 'Battle' },
    { key: Phase.END, label: 'End' },
  ];

  const canEndPhase = isPlayerTurn && (
    currentPhase === Phase.MAIN || 
    currentPhase === Phase.BATTLE
  );

  return (
    <div className={styles.phaseIndicator}>
      <div className={styles.phaseList}>
        {phases.map((phase) => (
          <div
            key={phase.key}
            className={clsx(styles.phase, {
              [styles.active]: currentPhase === phase.key,
              [styles.completed]: phases.findIndex(p => p.key === phase.key) < 
                                phases.findIndex(p => p.key === currentPhase),
            })}
          >
            <div className={styles.phaseIcon} />
            <span className={styles.phaseLabel}>{phase.label}</span>
          </div>
        ))}
      </div>
      
      {canEndPhase && (
        <button
          className={styles.endPhaseButton}
          onClick={onEndPhase}
        >
          End {phases.find(p => p.key === currentPhase)?.label} Phase
        </button>
      )}
    </div>
  );
};

export default PhaseIndicator;