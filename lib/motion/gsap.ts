'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Call inside a scoped useGSAP; focus and pointer input expose the readout immediately. */
export function revealTerminalReadout(root: HTMLElement | null, selector: string) {
  const content = root?.querySelector(selector);
  if (!root || !content || root.contains(document.activeElement)) return;
  const redraw = gsap.fromTo(content, { clipPath: 'inset(0 0 100% 0)' }, {
    clipPath: 'inset(0 0 0% 0)', duration: 0.28, ease: 'steps(12)', clearProps: 'clipPath',
  });
  const finish = () => { redraw.progress(1); };
  root.addEventListener('focusin', finish);
  root.addEventListener('pointerdown', finish);
  return () => { root.removeEventListener('focusin', finish); root.removeEventListener('pointerdown', finish); };
}

export { gsap, useGSAP, ScrollTrigger };
