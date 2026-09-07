'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

/** Animate the control's contents while its hit target stays in place. */
export function useControlMotion<T extends HTMLElement>(isPresent = true) {
  const rootRef = useRef<T>(null);
  const { allowMotion } = useMotionPolicy();

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !allowMotion || !isPresent) return;
    const label = root.querySelector('[data-control-label]');
    const arrow = root.querySelector('[data-control-arrow]');
    const scan = root.querySelector('[data-control-scan]');
    const rail = root.querySelector('[data-control-rail]');
    const hover = gsap.timeline({ paused: true, defaults: { duration: 0.32, ease: 'power3.out' } });
    if (label) hover.to(label, { x: 5 }, 0);
    if (arrow) hover.to(arrow, { x: 4, rotation: -8 }, 0.025);
    if (scan) hover.to(scan, { scaleX: 1, duration: 0.48, ease: 'expo.out' }, 0);
    if (rail) hover.to(rail, { scaleY: 1, duration: 0.24 }, 0);

    let isPointerInside = false;
    let hasFocus = false;
    const sync = () => {
      if (root.matches(':disabled')) { hover.progress(0).pause(); return; }
      if (isPointerInside || hasFocus) hover.timeScale(1).play();
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
