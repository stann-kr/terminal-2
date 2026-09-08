'use client';
import { useState, useEffect } from 'react';
import styles from './CountdownBlock.module.css';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

interface Props {
  targetDate: Date;
  /** 'primary' = home/gate primary 테마, 'secondary' = gate 카운트다운 테마 */
  accent?: 'primary' | 'secondary';
  /** 숫자 크기 및 패딩 축소 */
  compact?: boolean;
}

interface TimeDelta {
  elapsed: boolean;
  d: number;
  h: number;
  m: number;
  s: number;
}

function getTimeDelta(target: Date): TimeDelta {
  const diff = target.getTime() - Date.now();
  const abs = Math.abs(diff);
  return {
    elapsed: diff < 0,
    d: Math.floor(abs / 86400000),
    h: Math.floor((abs % 86400000) / 3600000),
    m: Math.floor((abs % 3600000) / 60000),
    s: Math.floor((abs % 60000) / 1000),
  };
}

export default function CountdownBlock({ targetDate, accent = 'primary', compact = false }: Props) {
  const { isDocumentVisible } = useMotionPolicy();
  const [delta, setDelta] = useState<TimeDelta>(() => getTimeDelta(targetDate));

  useEffect(() => {
    if (!isDocumentVisible) return;
    const frame = requestAnimationFrame(() => setDelta(getTimeDelta(targetDate)));
    const interval = setInterval(() => setDelta(getTimeDelta(targetDate)), 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [isDocumentVisible, targetDate]);

  const blocks = [
    { label: 'DAYS',    val: String(delta.d).padStart(2, '0') },
    { label: 'HOURS',   val: String(delta.h).padStart(2, '0') },
    { label: 'MINUTES', val: String(delta.m).padStart(2, '0') },
    { label: 'SECONDS', val: String(delta.s).padStart(2, '0') },
  ];

  return (
    <div className={styles.countdown} data-accent={accent} data-compact={compact} role="timer" aria-live="off">
      <p className={styles.mode}>{delta.elapsed ? 'T+ ELAPSED' : 'T- COUNTDOWN'}</p>
      <dl className={styles.units}>
        {blocks.map(block => (
          <div key={block.label} className={styles.unit}>
            <dt className={styles.label}>{block.label}</dt>
            <dd className={styles.value}>{block.val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
