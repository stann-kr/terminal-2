'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import styles from './DisplayEffects.module.css';

export default function DisplayEffects({ enabled, allowMotion }: { enabled: boolean; allowMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!enabled || !allowMotion) return;
    // Only the glass texture moves; content and hit targets stay in place.
    gsap.to('[data-crt-sweep]', { yPercent: 500, duration: 16, ease: 'none', repeat: -1 });
    gsap.to('[data-crt-grain]', {
      keyframes: [{ x: -3, y: 2 }, { x: 2, y: -3 }, { x: -2, y: 3 }, { x: 3, y: 1 }, { x: 0, y: 0 }],
      duration: 1.4, ease: 'none', defaults: { ease: 'steps(1)' }, repeat: -1,
    });
  }, { scope: ref, dependencies: [enabled, allowMotion], revertOnUpdate: true });

  return <div ref={ref} aria-hidden="true" hidden={!enabled} data-crt-effects data-motion={allowMotion} className={styles.effects}>
    <div className={styles.phosphor} />
    <div className={styles.raster} />
    <div data-crt-grain className={styles.grain} />
    <div data-crt-sweep className={styles.sweep} />
    <div className={styles.glass} />
    <div className={styles.vignette} />
  </div>;
}
