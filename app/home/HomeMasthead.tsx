'use client';

import { useRef } from 'react';
import CRTWrapper from '@/components/shell/CRTWrapper';
import { TitleText } from '@/components/ui/TerminalText';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './HomeMasthead.module.css';

const ASCII_FIELD = Array.from({ length: 12 }, (_, row) => Array.from({ length: 64 }, (_, col) => {
  const distance = Math.abs(row - 5.5) * 3 + Math.abs(col - 31.5) * 0.45;
  return distance < 17 ? '/+:.|-'[(row * 7 + col * 3) % 6] : ' ';
}).join('')).join('\n');

export default function HomeMasthead() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasEntered = useRef(false);
  const { allowMotion } = useMotionPolicy();

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !allowMotion) return;
    if (!hasEntered.current) {
      hasEntered.current = true;
      const entry = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.8 } });
      entry.addLabel('power')
        .from('[data-masthead="edge-x"]', { scaleX: 0, stagger: 0.12 }, 'power')
        .from('[data-masthead="edge-y"]', { scaleY: 0, stagger: 0.12 }, 'power+=0.1')
        .from('[data-masthead="path"]', { x: -20, opacity: 0.4, duration: 0.5 }, 'power+=0.08')
        .from('[data-masthead="command"]', { x: -16, opacity: 0.6 }, 'power+=0.16')
        .from('[data-masthead="tagline"]', { y: 12, opacity: 0.4, duration: 0.65 }, 'power+=0.28')
        .from('[data-masthead="ticks"] span', { scaleY: 0, stagger: 0.025, duration: 0.5 }, 'power+=0.25');
    }

    const idle = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.8 });
    idle.fromTo('[data-masthead="scan"]', { yPercent: -100, opacity: 0 }, { yPercent: 650, opacity: 0.75, duration: 2.8, ease: 'none' }, 0)
      .to('[data-masthead="scan"]', { opacity: 0, duration: 0.25 }, 2.6)
      .to('[data-masthead="cursor"]', { opacity: 0, duration: 0.55, ease: 'steps(1)', repeat: 3, yoyo: true }, 0.3);
    ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', animation: idle, toggleActions: 'play pause resume pause' });

    gsap.fromTo('[data-masthead="progress"]', { scaleX: 0.08 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: root, start: 'clamp(top top)', end: 'bottom top', scrub: 0.6 },
    });

    const media = gsap.matchMedia();
    media.add('(hover: hover) and (pointer: fine)', () => {
      const grid = root.querySelector('[data-masthead="grid"]');
      const xTo = gsap.quickTo(grid, 'x', { duration: 0.8, ease: 'power3.out' });
      const yTo = gsap.quickTo(grid, 'y', { duration: 0.8, ease: 'power3.out' });
      let bounds = root.getBoundingClientRect();
      const enter = () => { bounds = root.getBoundingClientRect(); };
      const move = (event: PointerEvent) => {
        xTo(((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 20);
        yTo(((event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5) * 12);
      };
      const leave = () => { xTo(0); yTo(0); };
      root.addEventListener('pointerenter', enter);
      root.addEventListener('pointermove', move);
      root.addEventListener('pointerleave', leave);
      return () => {
        root.removeEventListener('pointerenter', enter);
        root.removeEventListener('pointermove', move);
        root.removeEventListener('pointerleave', leave);
      };
    }, root);
    return () => media.revert();
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });

  return (
    <div ref={rootRef} id="home-ambient-anchor" className={styles.masthead}>
      <CRTWrapper>
        <pre aria-hidden="true" data-masthead="grid" className={styles.grid}>{ASCII_FIELD}</pre>
        <div aria-hidden="true" data-masthead="scan" className={styles.scan} />
        <div className={styles.brand}>
          <p data-masthead="path" className={styles.path}>[00] HOME / EVENT DIRECTORY</p>
          <div data-masthead="command" className={styles.command}>
            <span aria-hidden="true" className={styles.prompt}>&gt;</span>
            <TitleText text="TERMINAL" delay={160} className={`font-pixie ${styles.wordmark}`} />
            <span aria-hidden="true" data-masthead="cursor" className={styles.cursor} />
          </div>
          <p data-masthead="tagline" className={styles.tagline}>A VOYAGE TO THE UNKNOWN SECTOR</p>
          <div aria-hidden="true" data-masthead="ticks" className={styles.ticks}>{Array.from({ length: 18 }, (_, index) => <span key={index} />)}</div>
        </div>
      </CRTWrapper>
      <span aria-hidden="true" data-masthead="edge-x" className={styles.topEdge} />
      <span aria-hidden="true" data-masthead="edge-x" className={styles.bottomEdge} />
      <span aria-hidden="true" data-masthead="edge-y" className={styles.leftEdge} />
      <span aria-hidden="true" data-masthead="edge-y" className={styles.rightEdge} />
      <span aria-hidden="true" data-masthead="progress" className={styles.progress} />
    </div>
  );
}
