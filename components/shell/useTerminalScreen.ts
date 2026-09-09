'use client';

import { useRef } from 'react';
import { useGSAP, revealTerminalReadout } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

/** Replace the readout in place, with a brief phosphor settle. */
export function useTerminalScreen(pathname: string | null, enabled: boolean) {
  const screenRef = useRef<HTMLDivElement>(null);
  const paintedRoute = useRef<string | null | undefined>(undefined);
  const { isReady, allowMotion } = useMotionPolicy();

  useGSAP(() => {
    const screen = screenRef.current;
    if (!screen || !isReady || paintedRoute.current === pathname) return;
    paintedRoute.current = pathname;
    if (!allowMotion || !enabled) return;
    return revealTerminalReadout(screen, '[data-scroll-region]');
  }, { scope: screenRef, dependencies: [pathname, isReady, allowMotion, enabled], revertOnUpdate: true });

  return screenRef;
}
