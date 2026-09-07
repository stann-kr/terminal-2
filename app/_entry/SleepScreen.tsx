'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import TerminalButton from '@/components/TerminalButton';
import DecodeText from '@/components/DecodeText';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

interface SleepScreenProps {
  onWake: () => void;
}

export default function SleepScreen({ onWake }: SleepScreenProps) {
  const { allowMotion } = useMotionPolicy();
  const [isWaking, setIsWaking] = useState(false);
  const [time, setTime] = useState('');
  const wakeRequestedRef = useRef(false);
  const wakeCompletedRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-center items-center px-4 sm:px-6 select-none bg-terminal-bg-base font-mono overflow-hidden"
      initial={false}
      variants={{ idle: { opacity: 1 }, waking: { opacity: 0 } }}
      animate={isWaking ? 'waking' : 'idle'}
      transition={{ duration: allowMotion ? 0.16 : 0, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={(definition) => { if (definition === 'waking') completeWake(); }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
    >
      <div className="pointer-events-none absolute inset-0 z-20 opacity-20" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />

      <div className="relative z-10 w-full sm:w-[700px] md:w-[800px]">
        <motion.div
          className="text-5xl sm:text-6xl md:text-8xl font-bold mb-6 tracking-[0.15em] text-terminal-accent-primary drop-shadow-[0_0_8px_rgb(var(--color-accent-primary)/0.8)]"
          animate={allowMotion ? { opacity: [0.6, 0.8, 0.6] } : { opacity: 1 }}
          transition={allowMotion ? { duration: 4, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        >
          {time}
        </motion.div>

        <DecodeText
          text="TERMINAL // IDLE"
          autoHeight
          speed={0.6}
          scramble={6}
          step={2}
          className="text-small md:text-body leading-6 text-terminal-subdued"
        />
        {allowMotion && !isWaking && (
          <span className="cursor-blink text-small text-terminal-accent-primary" aria-hidden="true">█</span>
        )}

        <div className="mt-6">
          <TerminalButton onClick={wake} disabled={isWaking} variant="primary" className="px-6">
            [ RESUME SESSION ]
          </TerminalButton>
        </div>
      </div>
    </motion.div>
  );
}
