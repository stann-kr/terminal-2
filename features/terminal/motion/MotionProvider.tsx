'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// One GSAP registration for the production terminal surface.
gsap.registerPlugin(useGSAP);
export { gsap, useGSAP };

type Connection = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;
const MotionContext = createContext<boolean | null>(false);
const staticDisplayQueries = ['(prefers-reduced-motion: reduce)', '(prefers-contrast: more)', '(forced-colors: active)'];

function readPreference() {
  return !staticDisplayQueries.some(query => window.matchMedia(query).matches)
    && document.visibilityState !== 'hidden' && !connection()?.saveData;
}

function subscribe(change: () => void) {
  const media = staticDisplayQueries.map(query => window.matchMedia(query));
  const network = connection();
  media.forEach(preference => preference.addEventListener('change', change));
  document.addEventListener('visibilitychange', change);
  network?.addEventListener('change', change);
  return () => {
    media.forEach(preference => preference.removeEventListener('change', change));
    document.removeEventListener('visibilitychange', change);
    network?.removeEventListener('change', change);
  };
}

export function MotionProvider({ crt, children }: { crt: boolean; children: ReactNode }) {
  const preference = useSyncExternalStore(subscribe, readPreference, () => null);
  return <MotionContext.Provider value={preference === null ? null : crt && preference}>{children}</MotionContext.Provider>;
}

export const useMotionEnabled = () => useContext(MotionContext) === true;
export const useMotionReady = () => useContext(MotionContext) !== null;
