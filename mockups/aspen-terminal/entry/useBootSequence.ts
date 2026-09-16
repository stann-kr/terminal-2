import { useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// This bundle is independent of the Next app and owns its own GSAP registration.
gsap.registerPlugin(useGSAP);

export const STARTUP_LINES = [
  ['DISPLAY FRAME', 'READY'],
  ['EVENT DIRECTORY', 'READY'],
  ['ARTIST ROSTER', 'READY'],
  ['GUEST REQUEST VIEW', 'READY'],
  ['LOCALE CONFIGURATION', 'READY'],
] as const;

export const HANDOFF_LINES = [
  ['DIRECTORY FRAME', 'READY'],
  ['EVENT VIEW', 'READY'],
  ['PUBLIC GUESTBOOK', 'READY'],
  ['VISUAL SEQUENCE', 'COMPLETE'],
] as const;

type Phase = 'startup' | 'handoff' | 'ready';
type Connection = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;

function readMotionPreference() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && document.visibilityState !== 'hidden'
    && !connection()?.saveData;
}

function subscribeMotionPreference(change: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const network = connection();
  media.addEventListener('change', change);
  document.addEventListener('visibilitychange', change);
  network?.addEventListener('change', change);
  return () => {
    media.removeEventListener('change', change);
    document.removeEventListener('visibilitychange', change);
    network?.removeEventListener('change', change);
  };
}

export function useBootSequence(root: RefObject<HTMLElement | null>, crt: boolean) {
  const preference = useSyncExternalStore(subscribeMotionPreference, readMotionPreference, () => false);
  const allowMotion = crt && preference;
  const [phase, setPhase] = useState<Phase>(() => allowMotion ? 'startup' : 'ready');
  const [visibleRows, setVisibleRows] = useState(0);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    if (phase !== 'startup' && phase !== 'handoff') return;
    const next = phase === 'startup' ? 'handoff' : 'ready';
    if (!allowMotion) { setPhase('ready'); return; }
    const rows = phase === 'startup' ? STARTUP_LINES : HANDOFF_LINES;
    const lead = phase === 'startup' ? 0.45 : 0.12;
    const duration = lead + rows.length * 0.18;
    const sequence = gsap.timeline({ defaults: { ease: 'none' } });
    timeline.current = sequence;
    if (phase === 'startup') {
      sequence.fromTo('[data-entry-power]', { opacity: 0 }, { opacity: 0.55, duration: 0.18 }, 0)
        .to('[data-entry-power]', { opacity: 0, duration: 0.25 }, 0.18);
    }
    sequence.fromTo('[data-entry-progress]', { scaleX: 0 }, { scaleX: 1, duration, ease: 'steps(12)' }, 0);
    rows.forEach((_, index) => sequence.call(() => setVisibleRows(index + 1), [], lead + index * 0.18));
    sequence.call(() => { setVisibleRows(0); setPhase(next); }, [], duration + 0.12);
    return () => { timeline.current = null; };
  }, { scope: root, dependencies: [phase, allowMotion], revertOnUpdate: true });

  const skip = () => {
    timeline.current?.kill();
    setPhase('ready');
  };
  return {
    phase, allowMotion, skip,
    startupCount: phase === 'startup' ? visibleRows : STARTUP_LINES.length,
    handoffCount: phase === 'handoff' ? visibleRows : phase === 'ready' ? HANDOFF_LINES.length : 0,
  };
}
