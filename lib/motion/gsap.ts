'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Call inside a scoped useGSAP; content stays readable throughout its brief settle. */
export function revealTerminalReadout(root: HTMLElement | null, selector: string) {
  const content = root?.querySelector(selector);
  if (!root || !content || root.contains(document.activeElement)) return;
  const redraw = gsap.fromTo(content, { opacity: 0.88 }, {
    opacity: 1, duration: 0.11, ease: 'power2.out', clearProps: 'opacity',
  });
  const finish = () => { redraw.progress(1); };
  root.addEventListener('focusin', finish);
  root.addEventListener('pointerdown', finish);
  root.addEventListener('keydown', finish);
  return () => {
    root.removeEventListener('focusin', finish);
    root.removeEventListener('pointerdown', finish);
    root.removeEventListener('keydown', finish);
  };
}

export { gsap, useGSAP, ScrollTrigger };
