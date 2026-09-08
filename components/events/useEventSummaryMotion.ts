'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

export function useEventSummaryMotion(eventId: string, posterUrl?: string) {
  const rootRef = useRef<HTMLElement>(null);
  const enteredKey = useRef('');
  const { allowMotion } = useMotionPolicy();

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !allowMotion) return;
    const scroller = root.closest<HTMLElement>('[data-scroll-region]') ?? undefined;
    const key = `${eventId}:${posterUrl ?? ''}`;
    const poster = root.querySelector<HTMLElement>('[data-event="poster"]');
    const surface = root.querySelector<HTMLElement>('[data-event="surface"]');
    const image = root.querySelector('img');
    const scan = poster ? gsap.timeline({ paused: true })
      .fromTo('[data-event="scan"]', { yPercent: -110, opacity: 0 }, { yPercent: 740, opacity: 0.75, duration: 1.3, ease: 'power1.inOut' })
      .to('[data-event="scan"]', { opacity: 0, duration: 0.15 }, '-=0.15') : null;

    if (enteredKey.current !== key) {
      const entry = gsap.timeline({
        defaults: { duration: 0.75, ease: 'expo.out' },
        onStart: () => { enteredKey.current = key; scan?.restart(); },
        scrollTrigger: { trigger: root, scroller, start: 'top 94%', once: true },
      });
      if (poster) entry.from(poster, { y: 24, scale: 0.965, opacity: 0.65, duration: 1 }, 0);
      entry.from('[data-event="status"]', { x: -18, opacity: 0.5, duration: 0.5 }, 0.06)
        .from('[data-event="title"]', { y: 22, opacity: 0.55 }, 0.14)
        .from('[data-event="metadata"] > div', { x: -12, opacity: 0.6, stagger: 0.085 }, 0.22);
      const description = root.querySelector('[data-event="description"]');
      if (description) entry.from(description, { y: 12, opacity: 0.65 }, 0.32);
    }

    if (poster) {
      gsap.fromTo('[data-event="progress"]', { scaleY: 0.08 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: poster, scroller, start: 'clamp(top 80%)', end: 'clamp(bottom 20%)', scrub: 0.45 },
      });
    }
    const imageReady = () => {
      ScrollTrigger.refresh(true);
      if (poster && ScrollTrigger.isInViewport(poster)) scan?.restart();
    };
    image?.addEventListener('load', imageReady);

    const media = gsap.matchMedia();
    if (poster && surface) media.add('(hover: hover) and (pointer: fine)', () => {
      const rotateX = gsap.quickTo(surface, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      const rotateY = gsap.quickTo(surface, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      let bounds = poster.getBoundingClientRect();
      const enter = () => { bounds = poster.getBoundingClientRect(); scan?.restart(); };
      const move = (event: PointerEvent) => {
        rotateX((0.5 - (event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 5);
        rotateY(((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 7);
      };
      const leave = () => { rotateX(0); rotateY(0); };
      poster.addEventListener('pointerenter', enter);
      poster.addEventListener('pointermove', move);
      poster.addEventListener('pointerleave', leave);
      return () => {
        poster.removeEventListener('pointerenter', enter);
        poster.removeEventListener('pointermove', move);
        poster.removeEventListener('pointerleave', leave);
      };
    }, root);

    return () => {
      image?.removeEventListener('load', imageReady);
      media.revert();
    };
  }, { scope: rootRef, dependencies: [allowMotion, eventId, posterUrl], revertOnUpdate: true });

  return rootRef;
}
