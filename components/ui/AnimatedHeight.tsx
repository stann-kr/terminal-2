'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion/gsap';

interface AnimatedHeightProps {
  children: React.ReactNode;
  /**
   * false: height → 0, opacity → 0 (숨김 애니메이션)
   * true(기본값): 내부 content 높이를 ResizeObserver로 추적하며 부드럽게 전환
   */
  show?: boolean;
  /** 펼침 지속 시간 (ms). 닫기는 이 값의 70%로 반응한다. */
  duration?: number;
  className?: string;
  id?: string;
}

/**
 * GSAP owns height while ResizeObserver supplies the content's natural size.
 * New requests overwrite the current tween without reverting to its start.
 */
export default function AnimatedHeight({
  children,
  show = true,
  duration = 180,
  className,
  id,
}: AnimatedHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [initialStyle] = useState({ height: show ? 'auto' : '0px', opacity: show ? 1 : 0 });
  const { allowMotion } = useMotionPolicy();
  const latest = useRef({ show, duration, allowMotion });
  const syncRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    latest.current = { show, duration, allowMotion };
    syncRef.current?.();
  }, [show, duration, allowMotion]);

  useGSAP((_context, contextSafe) => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const sync = contextSafe!(() => {
      const current = latest.current;
      const seconds = current.allowMotion ? current.duration / 1000 * (current.show ? 1 : 0.7) : 0;
      gsap.to(outer, {
        height: current.show ? inner.offsetHeight : 0,
        opacity: current.show ? 1 : 0,
        duration: seconds,
        ease: 'power3.out', overwrite: true,
        onComplete: seconds ? () => ScrollTrigger.refresh(true) : undefined,
      });
    });
    syncRef.current = sync;
    const observer = new ResizeObserver(sync);
    observer.observe(inner);
    sync();
    return () => {
      syncRef.current = null;
      observer.disconnect();
    };
  }, { scope: outerRef });

  return (
    <div
      id={id}
      ref={outerRef}
      aria-hidden={!show}
      inert={!show}
      style={{
        overflow: 'hidden',
        ...initialStyle,
      }}
    >
      <div ref={innerRef} className={className}>
        {children}
      </div>
    </div>
  );
}
