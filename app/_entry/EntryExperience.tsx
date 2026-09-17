'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/langContext';
import { hasVisited, markVisited } from './visitState';
import BootSequence from './BootSequence';
import SleepScreen from './SleepScreen';
import HomeAmbient from '../home/HomeAmbient';

type Phase = 'pending' | 'boot' | 'sleep' | 'done';

export default function EntryExperience() {
  const [phase, setPhase] = useState<Phase>('pending');
  const { lang } = useLang();
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase(hasVisited() ? 'sleep' : 'boot'), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleBootComplete = () => {
    markVisited();
    setPhase('done');
    router.push('/home');
  };

  const handleWake = () => {
    setPhase('done');
    router.push('/home');
  };

  const isEntryVisible = phase === 'boot' || phase === 'sleep';

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-dvh">
      <HomeAmbient anchorId="main-content" />
      <div className={isEntryVisible ? 'sr-only' : 'min-h-screen flex flex-col items-center justify-center gap-6 px-5'}>
        <h1 className="text-3xl font-mono">TERMINAL</h1>
        {!isEntryVisible && (
          <Link href="/home" className="min-h-11 inline-flex items-center border border-terminal-accent-primary px-5 text-base text-terminal-accent-primary">
            {lang === 'ko' ? '이벤트 보기' : 'View events'}
          </Link>
        )}
      </div>
      <AnimatePresence mode="wait">
        {phase === 'boot' && <BootSequence key="boot" onComplete={handleBootComplete} />}
        {phase === 'sleep' && <SleepScreen key="sleep" onWake={handleWake} />}
      </AnimatePresence>
    </main>
  );
}
