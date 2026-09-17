'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

/** Scan the selected control without moving its text or hit target. */
export function useControlMotion<T extends HTMLElement>(isPresent = true) {
  const rootRef = useRef<T>(null);
  const { allowMotion } = useMotionPolicy();

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !allowMotion || !isPresent) return;
    const scan = root.querySelector('[data-control-scan]');
    const rail = root.querySelector('[data-control-rail]');
    const hover = gsap.timeline({ paused: true, defaults: { duration: 0.16, ease: 'steps(4)' } });
    if (scan) hover.to(scan, { scaleX: 1 }, 0);
    if (rail) hover.to(rail, { scaleY: 1, duration: 0.1 }, 0);

    let isPointerInside = false;
    let hasFocus = false;
    const sync = () => {
      if (root.matches(':disabled')) { hover.progress(0).pause(); return; }
      if (hasFocus) { hover.progress(1).pause(); return; }
      if (isPointerInside) hover.timeScale(1).play();
      else hover.timeScale(1.6).reverse();
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      isPointerInside = true;
      sync();
    };
    const leave = () => { isPointerInside = false; sync(); };
    const focus = () => { hasFocus = true; sync(); };
    const blur = () => { hasFocus = false; sync(); };
    root.addEventListener('pointerenter', enter);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('focus', focus);
    root.addEventListener('blur', blur);

    return () => {
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('focus', focus);
      root.removeEventListener('blur', blur);
    };
  }, { scope: rootRef, dependencies: [allowMotion, isPresent], revertOnUpdate: true });

  return rootRef;
}
