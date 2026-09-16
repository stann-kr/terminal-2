import { useRef } from 'react';
import { gsap, useGSAP, useMotionEnabled } from './MotionProvider';
import './motion.css';

export function PendingIndicator({ active }: { active: boolean }) {
  const root = useRef<HTMLSpanElement>(null);
  const enabled = useMotionEnabled();
  useGSAP(() => {
    if (!enabled || !active) return;
    gsap.fromTo('[data-pending-pulse]', { xPercent: -110 }, { xPercent: 290, duration: 0.85, ease: 'none', repeat: -1 });
  }, { scope: root, dependencies: [enabled, active], revertOnUpdate: true });
  return <span ref={root} className="tm-pending-track" aria-hidden="true"><span data-pending-pulse /></span>;
}
