'use client';

import { useRef } from 'react';
import { gsap, useGSAP, useMotionEnabled } from './MotionProvider';
import './motion.css';

export function PendingIndicator({ active }: { active: boolean }) {
  const root = useRef<HTMLSpanElement>(null);
  const enabled = useMotionEnabled();
  useGSAP(() => {
    if (!enabled || !active) return;
    gsap.fromTo('[data-pending-pulse]', { opacity: 1 }, { opacity: 0, duration: 0.42, ease: 'steps(1)', repeat: -1, yoyo: true });
  }, { scope: root, dependencies: [enabled, active], revertOnUpdate: true });
  return <span ref={root} className="tm-pending-cursor" aria-hidden="true"><span data-pending-pulse>▌</span></span>;
}
