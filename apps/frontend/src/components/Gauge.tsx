import React from 'react';
import { FieldPosition } from '@cnp-tcg/common-types';
import clsx from 'clsx';
import styles from './Gauge.module.css';

interface GaugeProps {
  current: number;
  max: number;
  position: FieldPosition;
  isOpponent: boolean;
}

const Gauge: React.FC<GaugeProps> = ({ current, max, position, isOpponent }) => {
  const percentage = (current / max) * 100;
  
  const getGaugeColor = () => {
    if (percentage > 66) return styles.gaugeHigh;
    if (percentage > 33) return styles.gaugeMedium;
    return styles.gaugeLow;
  };

  return (
    <div className={clsx(styles.gauge, {
      [styles.opponent]: isOpponent,
    })}>
      <div className={styles.gaugeLabel}>
        {position} GAUGE
      </div>
      <div className={styles.gaugeBar}>
        <div 
          className={clsx(styles.gaugeFill, getGaugeColor())}
          style={{ width: `${percentage}%` }}
        />
        <div className={styles.gaugeText}>
          {current}/{max}
        </div>
      </div>
    </div>
  );
};

export default Gauge;