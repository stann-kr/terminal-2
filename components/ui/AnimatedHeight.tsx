'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

interface AnimatedHeightProps {
  children: React.ReactNode;
  /**
   * false: height → 0, opacity → 0 (숨김 애니메이션)
   * true(기본값): 내부 content 높이를 ResizeObserver로 추적하며 부드럽게 전환
   */
  show?: boolean;
  /** CSS transition 지속 시간 (ms). 기본 200 */
  duration?: number;
  className?: string;
  id?: string;
}

/**
 * ResizeObserver + CSS transition 기반 height 애니메이터.
 *
 * framer-motion의 `height: 'auto'` snapshot 대신 실제 내부 높이를 계속 관찰한다.
 * ResizeObserver로 내부 div의 높이 변화를 감지하고 CSS transition으로
 * 외부 컨테이너 높이를 부드럽게 추적한다.
 */
export default function AnimatedHeight({
  children,
  show = true,
  duration = 200,
  className,
  id,
}: AnimatedHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [initialHeight] = useState(show ? 'auto' : '0px');
  const { allowMotion } = useMotionPolicy();

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const sync = () => {
      outer.style.height = show ? `${inner.offsetHeight}px` : '0px';
    };

    const observer = new ResizeObserver(sync);
    observer.observe(inner);
    sync(); // 초기 동기화

    return () => observer.disconnect();
  }, [show]);

  return (
    <div
      id={id}
      ref={outerRef}
      aria-hidden={!show}
      inert={!show}
      style={{
        overflow: 'hidden',
        height: initialHeight,
        opacity: show ? 1 : 0,
        transition: allowMotion
          ? `height ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
          : 'none',
      }}
    >
      <div ref={innerRef} className={className}>
        {children}
      </div>
    </div>
  );
}
