'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

/** Redraw the display buffer while the machine's navigation remains still. */
export function useTerminalScreen(pathname: string | null) {
  const screenRef = useRef<HTMLDivElement>(null);
  const paintedRoute = useRef<string | null | undefined>(undefined);
  const { isReady, allowMotion } = useMotionPolicy();

  useGSAP(() => {
    const screen = screenRef.current;
    if (!screen || !isReady || paintedRoute.current === pathname) return;
    paintedRoute.current = pathname;
    if (!allowMotion) return;
    const curtain = screen.querySelector('[data-screen-curtain]');
    const beam = screen.querySelector('[data-screen-beam]');
    const clear = () => { delete screen.dataset.redrawing; };
    screen.dataset.redrawing = 'true';
    const redraw = gsap.timeline({ onComplete: clear });
    redraw
      .fromTo(curtain, { scaleY: 1, opacity: 1 }, { scaleY: 0, duration: 0.32, ease: 'steps(14)' }, 0)
      .fromTo(beam, { y: -24, opacity: 0.7 }, { y: screen.clientHeight, duration: 0.32, ease: 'steps(14)' }, 0)
      .set([curtain, beam], { opacity: 0 });

    // A user's next action takes precedence over a decorative redraw.
    const finish = () => { redraw.progress(1); };
    screen.addEventListener('pointerdown', finish);
    screen.addEventListener('keydown', finish);
    return () => {
      clear();
      screen.removeEventListener('pointerdown', finish);
      screen.removeEventListener('keydown', finish);
    };
  }, { scope: screenRef, dependencies: [pathname, isReady, allowMotion], revertOnUpdate: true });

  return screenRef;
}
