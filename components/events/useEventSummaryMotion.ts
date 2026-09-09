'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, revealTerminalReadout } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

export function useEventSummaryMotion(eventId: string, posterUrl?: string) {
  const rootRef = useRef<HTMLElement>(null);
  const readoutKey = useRef('');
  const { allowMotion } = useMotionPolicy();

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !allowMotion) return;
    const key = `${eventId}:${posterUrl ?? ''}`;
    const scroller = root.closest<HTMLElement>('[data-scroll-region]') ?? undefined;
    const poster = root.querySelector<HTMLElement>('[data-event="poster"]');
    const image = root.querySelector('img');
    if (!poster) return;

    const clearReadout = readoutKey.current !== key ? revealTerminalReadout(root, '[data-event="readout"]') : undefined;
    readoutKey.current = key;
    gsap.fromTo('[data-event="progress"]', { scaleY: 0.08 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: poster, scroller, start: 'clamp(top 80%)', end: 'clamp(bottom 20%)', scrub: true },
    });
    const imageReady = () => ScrollTrigger.refresh(true);
    image?.addEventListener('load', imageReady);
    return () => { image?.removeEventListener('load', imageReady); clearReadout?.(); };
  }, { scope: rootRef, dependencies: [allowMotion, eventId, posterUrl], revertOnUpdate: true });

  return rootRef;
}
