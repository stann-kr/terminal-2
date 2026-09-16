import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// The offline mockup has its own entry point, independent of the Next app.
gsap.registerPlugin(useGSAP);
export { gsap, useGSAP };

type Connection = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;
const MotionContext = createContext(false);

function readPreference() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && document.visibilityState !== 'hidden' && !connection()?.saveData;
}

function subscribe(change: () => void) {
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

export function MotionProvider({ crt, children }: { crt: boolean; children: ReactNode }) {
  const preference = useSyncExternalStore(subscribe, readPreference, () => false);
  return <MotionContext.Provider value={crt && preference}>{children}</MotionContext.Provider>;
}

export const useMotionEnabled = () => useContext(MotionContext);
