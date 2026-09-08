'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import TerminalButton from '@/components/TerminalButton';
import DecodeText from '@/components/DecodeText';
import { useLang, type Lang } from '@/lib/langContext';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './EntryScreen.module.css';

interface TextItem { type: 'text'; text: string; delay: number; accent?: boolean; warn?: boolean; cyan?: boolean }
interface ProgressItem { type: 'progress'; label: string; delay: number }
type BootItem = TextItem | ProgressItem;

const PHASE_1: BootItem[] = [
  { type: 'text',     text: 'TERMINAL INTERFACE // VISUAL BOOT SEQUENCE',    delay: 0 },
  { type: 'text',     text: 'DISPLAY CHANNEL........................ READY',   delay: 100 },
  { type: 'text',     text: 'INPUT CHANNEL.......................... READY',   delay: 200 },
  { type: 'progress', label: 'LOADING INTERFACE MODULES',                     delay: 350 },
  { type: 'text',     text: 'MOUNTING VISUAL FRAME.................. OK',       delay: 1000 },
  { type: 'text',     text: 'LOADING EVENT DIRECTORY............... OK',       delay: 1100 },
  { type: 'text',     text: 'PREPARING ACCESS REQUEST CHANNEL...... OK',       delay: 1200 },
  { type: 'text',     text: 'INITIALIZING LOCALE MODULE............ OK',       delay: 1350 },
  { type: 'text',     text: 'LOCALE CONFIGURATION REQUIRED',                 delay: 1450, warn: true },
];

const LANG_SELECT_DELAY = 1600;

const getPhase3 = (lang: Lang): TextItem[] => [
  { type: 'text', text: `LANGUAGE SET : ${lang.toUpperCase()} ............... OK`, delay: 0,    cyan: true },
  { type: 'text', text: 'DRAWING DIRECTORY FRAME............... OK',                 delay: 200 },
  { type: 'text', text: 'PREPARING EVENT VIEW.................. OK',                 delay: 500 },
  { type: 'text', text: 'PREPARING ARTIST ROSTER................ OK',                 delay: 800 },
  { type: 'text', text: 'PREPARING PUBLIC GUESTBOOK............. OK',                 delay: 1000 },
  { type: 'text', text: 'TERMINAL / SEOUL',                                           delay: 1200 },
  { type: 'text', text: 'A VOYAGE TO THE UNKNOWN SECTOR',                             delay: 1400, accent: true },
  { type: 'text', text: 'VISUAL SEQUENCE COMPLETE',                                   delay: 1600 },
  { type: 'text', text: '──────────────────────────────────────────',               delay: 1750 },
  { type: 'text', text: 'SYSTEM READY. AWAITING INPUT.',                            delay: 1950, accent: true },
];

const PHASE_3_DONE_DELAY = 2200;

interface BootLineProps {
  text: string;
  accent?: boolean;
  warn?: boolean;
  cyan?: boolean;
}

function BootLine({ text, accent, warn, cyan }: BootLineProps) {
  let colorClass = 'text-terminal-subdued font-normal';
  if (accent) colorClass = 'text-terminal-accent-primary drop-shadow-[0_0_8px_rgb(var(--color-accent-primary)/0.8)] font-bold';
  else if (cyan) colorClass = 'text-terminal-accent-secondary font-normal';
  else if (warn) colorClass = 'text-terminal-accent-warn font-normal';

  return (
    <DecodeText
      text={text}
      autoHeight
      speed={0.6}
      scramble={6}
      step={2}
      className={`text-small md:text-body leading-6 font-mono whitespace-pre-wrap ${colorClass}`}
    />
  );
}

function ProgressLine({ label }: { label: string }) {
  const { allowMotion } = useMotionPolicy();
  const [pct, setPct] = useState(0);
  const DURATION = 600;
  const BARS = 20;

  useEffect(() => {
    if (!allowMotion) return;
    let startTime: number | null = null;
    let rafId: number;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      setPct(Math.floor(progress * 100));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [allowMotion]);

  const displayedPct = allowMotion ? pct : 100;
  const filled = Math.round((displayedPct / 100) * BARS);
  const empty = BARS - filled;

  return (
    <div className="text-small md:text-body leading-6 font-mono text-terminal-subdued">
      <span>{label} </span>
      <span className="text-terminal-accent-primary">{'█'.repeat(filled)}</span>
      <span className="text-terminal-muted/30">{'░'.repeat(empty)}</span>
      <span className="text-terminal-muted ml-2">{displayedPct}%</span>
    </div>
  );
}

interface LangSelectPromptProps {
  onSelect: (lang: Lang) => void;
}

function LangSelectPrompt({ onSelect }: LangSelectPromptProps) {
  const [chosen, setChosen] = useState<Lang | null>(null);

  const handle = (lang: Lang) => {
    if (chosen) return;
    setChosen(lang);
    onSelect(lang);
  };

  const btn = (target: Lang, label: string) => {
    const active = chosen === target;
    const inactive = chosen !== null && chosen !== target;
    return (
      <button
        type="button"
        onClick={() => handle(target)}
        disabled={chosen !== null}
        className={`min-h-11 font-mono text-small md:text-body tracking-normal px-3 py-2 border transition-colors cursor-pointer disabled:cursor-default ${
          active
            ? 'border-terminal-accent-secondary text-terminal-accent-secondary bg-terminal-accent-secondary/10'
            : inactive
            ? 'border-terminal-muted/20 text-terminal-muted/20'
            : 'border-terminal-accent-secondary/50 text-terminal-accent-secondary/70 hover:border-terminal-accent-secondary hover:text-terminal-accent-secondary hover:bg-terminal-accent-secondary/5'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mt-3 mb-1">
      <div className="text-small md:text-body font-mono text-terminal-accent-secondary/80 mb-2 tracking-wider">
        ▸ SELECT SYSTEM LANGUAGE :
      </div>
      <div className="flex items-center gap-3">
        {btn('ko', '[ KO ] 한국어')}
        {btn('en', '[ EN ] English')}
      </div>
    </div>
  );
}

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const { setLang, lang } = useLang();
  const { isReady: isMotionPolicyReady, allowMotion } = useMotionPolicy();
  const [visiblePhase1, setVisiblePhase1] = useState<number[]>([]);
  const [showLangSelect, setShowLangSelect] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang | null>(null);
  const [visiblePhase3, setVisiblePhase3] = useState<number[]>([]);
  const [powering, setPowering] = useState(true);
  const [done, setDone] = useState(false);
  const hasCompletedRef = useRef(false);
  const skippedPhase1Ref = useRef(false);

  // 대기 중인 부트 출력 타이머 — 스킵 시 일괄 clear
  const phase1TimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const langTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase3TimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isMotionPolicyReady) return;
    const t = setTimeout(() => setPowering(false), allowMotion ? 700 : 0);
    return () => clearTimeout(t);
  }, [allowMotion, isMotionPolicyReady]);

  useEffect(() => {
    if (powering || !isMotionPolicyReady || skippedPhase1Ref.current) return;

    if (!allowMotion) {
      const timer = setTimeout(() => {
        setVisiblePhase1(PHASE_1.map((_, i) => i));
        setShowLangSelect(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timers = PHASE_1.map((item, i) =>
      setTimeout(() => setVisiblePhase1(prev => [...prev, i]), item.delay)
    );
    const langTimer = setTimeout(() => setShowLangSelect(true), LANG_SELECT_DELAY);
    phase1TimersRef.current = timers;
    langTimerRef.current = langTimer;
    return () => { timers.forEach(clearTimeout); clearTimeout(langTimer); };
  }, [allowMotion, isMotionPolicyReady, powering]);

  useEffect(() => {
    if (!selectedLang || !isMotionPolicyReady) return;
    const phase3 = getPhase3(selectedLang);

    if (!allowMotion) {
      const timer = setTimeout(() => {
        setVisiblePhase3(phase3.map((_, i) => i));
        setDone(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timers = phase3.map((item, i) =>
      setTimeout(() => setVisiblePhase3(prev => [...prev, i]), item.delay)
    );
    const doneTimer = setTimeout(() => setDone(true), PHASE_3_DONE_DELAY);
    phase3TimersRef.current = timers;
    doneTimerRef.current = doneTimer;
    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer); };
  }, [allowMotion, isMotionPolicyReady, selectedLang]);

  /**
   * 진행 중인 출력 애니메이션을 건너뛰고 다음 인터랙션 포인트로 점프.
   * - 언어 선택 전(phase1) → phase1 전체 즉시 표시 + 언어 선택 즉시 노출
   * - 언어 선택 후(phase3) → phase3 전체 즉시 표시 + done(ENTER TERMINAL)
   * 언어 선택 대기 중에는 버튼을 비활성화해 자동 선택을 막는다.
   */
  const skipToNextGate = () => {
    if (powering) {
      skippedPhase1Ref.current = true;
      setPowering(false);
      setVisiblePhase1(PHASE_1.map((_, i) => i));
      setShowLangSelect(true);
      return;
    }

    if (!selectedLang) {
      skippedPhase1Ref.current = true;
      phase1TimersRef.current.forEach(clearTimeout);
      if (langTimerRef.current) clearTimeout(langTimerRef.current);
      setVisiblePhase1(PHASE_1.map((_, i) => i));
      setShowLangSelect(true);
      return;
    }

    if (!done) {
      phase3TimersRef.current.forEach(clearTimeout);
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      setVisiblePhase3(getPhase3(selectedLang).map((_, i) => i));
      setDone(true);
    }
  };

  const handleLangSelect = (lang: Lang) => {
    setLang(lang);
    setSelectedLang(lang);
  };

  const phase3Items = selectedLang ? getPhase3(selectedLang) : [];
  const showSkipHint = !powering && !done && !(showLangSelect && !selectedLang);

  return (
    <motion.section className={styles.screen} aria-labelledby="boot-title" initial={false} exit={{ opacity: 0, transition: { duration: allowMotion ? 0.2 : 0 } }}>
      <header className={styles.header}>
        <h2 id="boot-title">TERMINAL <span>/ BOOT</span></h2>
        <div className={styles.headerActions}><Link href="/home">{lang === 'ko' ? '이벤트 보기' : 'View events'}</Link><TerminalButton onClick={skipToNextGate} disabled={done || (showLangSelect && !selectedLang)} variant="ghost">{lang === 'ko' ? '애니메이션 건너뛰기' : 'Skip animation'}</TerminalButton></div>
      </header>
      <div className={styles.console}>
        <p className={styles.caption}>{lang === 'ko' ? '터미널 체험' : 'Terminal experience'} <span aria-hidden="true">/ VISUAL BOOT SEQUENCE</span></p>
        <motion.div aria-hidden="true" className={styles.beam} initial={false} animate={{ scaleX: powering ? 0.03 : 1 }} transition={{ duration: allowMotion ? 0.6 : 0 }} />
        {/* Phase 1 */}
        {PHASE_1.map((item, i) =>
          visiblePhase1.includes(i) ? (
            <motion.div key={`p1-${i}`} initial={allowMotion ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: allowMotion ? 0.05 : 0 }}>
              {item.type === 'progress' ? (
                <ProgressLine label={item.label} />
              ) : (
                <>
                  {item.warn && <span className="text-terminal-accent-warn text-small font-mono">⚠ </span>}
                  <BootLine text={item.text} accent={item.accent} warn={item.warn} />
                </>
              )}
            </motion.div>
          ) : null
        )}

        {/* Phase 2: 언어 선택 프롬프트 */}
        {showLangSelect && !selectedLang && (
          <motion.div initial={allowMotion ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: allowMotion ? 0.2 : 0 }}>
            <LangSelectPrompt onSelect={handleLangSelect} />
          </motion.div>
        )}

        {/* Phase 3 */}
        {phase3Items.map((item, i) =>
          visiblePhase3.includes(i) ? (
            <motion.div key={`p3-${i}`} initial={allowMotion ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: allowMotion ? 0.05 : 0 }}>
              {item.warn && <span className="text-terminal-accent-warn text-small font-mono">⚠ </span>}
              <BootLine text={item.text} accent={item.accent} warn={item.warn} cyan={item.cyan} />
            </motion.div>
          ) : null
        )}

        {/* 커서 블링크 */}
        {allowMotion && !powering && !done && (
          <span className="cursor-blink text-small text-terminal-accent-primary" aria-hidden="true">█</span>
        )}

        {/* ENTER TERMINAL 버튼 */}
        {done && (
          <motion.div initial={allowMotion ? { opacity: 0 } : false} animate={{ opacity: 1 }} className="mt-6">
            <TerminalButton onClick={() => { if (!hasCompletedRef.current) { hasCompletedRef.current = true; onComplete(); } }} variant="primary" className="px-6">
              [ ENTER TERMINAL ]
            </TerminalButton>
          </motion.div>
        )}
      </div>

      {showSkipHint && (
        <p className={styles.hint}>{lang === 'ko' ? '위의 버튼으로 애니메이션을 건너뛸 수 있습니다.' : 'Use the button above to skip the animation.'}</p>
      )}
    </motion.section>
  );
}
