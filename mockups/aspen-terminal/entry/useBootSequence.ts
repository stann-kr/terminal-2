import { useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// This bundle is independent of the Next app and owns its own GSAP registration.
gsap.registerPlugin(useGSAP);

export const BOOT_LINES = [
  ['DISPLAY FRAME', 'READY'],
  ['EVENT DIRECTORY', 'READY'],
  ['ARTIST ROSTER', 'READY'],
  ['GUEST REQUEST VIEW', 'READY'],
  ['LOCALE CONFIGURATION', 'READY'],
  ['PUBLIC GUESTBOOK', 'READY'],
  ['TERMINAL INTERFACE', 'READY'],
] as const;

// A line opens before its result arrives. Short bursts follow longer waits,
// rather than giving every operation the same artificial typing cadence.
const OUTPUT_CUES = [
  [0, 0.23], [0.26, 0.64], [0.66, 0.73], [0.78, 1.21],
  [1.23, 1.33], [1.64, 1.7], [1.74, 2],
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
  const [output, setOutput] = useState({ started: 0, completed: 0 });
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const ready = phase === 'ready';

  useGSAP(() => {
    if (ready) return;
    if (!allowMotion) { setPhase('ready'); return; }
    const sequence = gsap.timeline({ defaults: { ease: 'none' } });
    timeline.current = sequence;
    sequence.addLabel('power', 0)
      .addLabel('readout', 0.82)
      .addLabel('handoff', 2.46)
      .addLabel('ready', 3.06)
      // Only the decorative phosphor/black veil moves; controls stay in place.
      .fromTo('[data-entry-phosphor]', { scaleX: 0.025, scaleY: 0.003, opacity: 0 },
        { scaleX: 1, opacity: 0.65, duration: 0.2, ease: 'power2.out' }, 'power+=0.08')
      .to('[data-entry-phosphor]', { scaleY: 1, opacity: 0.08, duration: 0.4, ease: 'expo.out' }, 'power+=0.28')
      .fromTo('[data-entry-power]', { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 'power+=0.32');
    OUTPUT_CUES.forEach(([start, complete], index) => {
      sequence.call(() => setOutput(current => ({ ...current, started: index + 1 })), [], `readout+=${start}`)
        .call(() => setOutput(current => ({ ...current, completed: index + 1 })), [], `readout+=${complete}`);
    });
    sequence.call(() => setPhase('handoff'), [], 'handoff')
      .call(() => setPhase('ready'), [], 'ready');
    return () => { timeline.current = null; };
  }, { scope: root, dependencies: [ready, allowMotion], revertOnUpdate: true });

  const skip = () => {
    timeline.current?.kill();
    setPhase('ready');
  };
  return {
    phase, allowMotion, skip,
    startedCount: ready ? BOOT_LINES.length : output.started,
    completedCount: ready ? BOOT_LINES.length : output.completed,
  };
}
