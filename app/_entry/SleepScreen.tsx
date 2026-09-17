'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import TerminalButton from '@/components/TerminalButton';
import DecodeText from '@/components/DecodeText';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import { useLang } from '@/lib/langContext';
import styles from './EntryScreen.module.css';

interface SleepScreenProps { onWake: () => void; }

export default function SleepScreen({ onWake }: SleepScreenProps) {
  const { allowMotion, isDocumentVisible } = useMotionPolicy();
  const { lang } = useLang();
  const [isWaking, setIsWaking] = useState(false);
  const [time, setTime] = useState('--:--:--');
  const wakeRequestedRef = useRef(false);
  const wakeCompletedRef = useRef(false);
  useEffect(() => {
    if (!isDocumentVisible) return;
    const update = () => setTime(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [isDocumentVisible]);
  const completeWake = useCallback(() => {
    if (!wakeRequestedRef.current || wakeCompletedRef.current) return;
    wakeCompletedRef.current = true;
    onWake();
  }, [onWake]);
  const wake = useCallback(() => {
    if (wakeRequestedRef.current) return;
    wakeRequestedRef.current = true;
    setIsWaking(true);
    if (!allowMotion) completeWake();
  }, [allowMotion, completeWake]);

  return <motion.section className={styles.screen} aria-labelledby="sleep-title" initial={false} variants={{ idle: { opacity: 1 }, waking: { opacity: 0 } }} animate={isWaking ? 'waking' : 'idle'} transition={{ duration: allowMotion ? 0.16 : 0, ease: [0.16, 1, 0.3, 1] }} onAnimationComplete={definition => { if (definition === 'waking') completeWake(); }} exit={{ opacity: 0, transition: { duration: 0 } }}>
    <header className={styles.header}><h2 id="sleep-title">TERMINAL <span>/ IDLE</span></h2><p className={styles.caption}>{lang === 'ko' ? '터미널 체험' : 'Terminal experience'}</p></header>
    <div className={styles.sleep}>
      <p className={styles.caption}>SEOUL_TIME / KST</p>
      <p className={styles.clock}>{time}</p>
      <DecodeText text="TERMINAL // IDLE" autoHeight speed={0.6} scramble={6} step={2} className="text-small text-terminal-subdued" />
      <p className={styles.sleepMessage}>{lang === 'ko' ? '이벤트와 라인업을 계속 둘러보세요.' : 'Continue exploring the events and lineup.'}</p>
      <TerminalButton onClick={wake} disabled={isWaking} variant="primary">{lang === 'ko' ? '이벤트로 돌아가기' : 'Return to events'}</TerminalButton>
    </div>
  </motion.section>;
}
