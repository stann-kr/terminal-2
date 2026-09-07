'use client';

import {
  memo,
  useEffect,
  useRef,
  type CSSProperties,
} from 'react';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

gsap.registerPlugin(ScrambleTextPlugin);

export interface DecodeTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3';
  speed?: number;
  scramble?: number;
  step?: number;
  delay?: number;
  onComplete?: () => void;
  playOnMount?: boolean;
  autoHeight?: boolean;
}

/**
 * Semantic-first cipher enhancement.
 *
 * The final text is always rendered as the real SSR child. The client may
 * temporarily replace that text for the cipher effect, while aria-label keeps
 * the accessible name stable. Reduced-motion, save-data, and hidden documents
 * retain the final text and stop the animation loop.
 */
const DecodeText = memo(function DecodeText({
  text,
  className = '',
  style,
  as: Tag = 'span',
  speed = 0.5,
  scramble = 8,
  step = 1,
  delay = 0,
  onComplete,
  playOnMount = true,
  autoHeight = false,
}: DecodeTextProps) {
  const { isReady, allowMotion } = useMotionPolicy();
  const nodeRef = useRef<HTMLElement | null>(null);
  const playbackRef = useRef({ text, started: false, completed: false });
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useGSAP(() => {
    const node = nodeRef.current;
    if (!node || !isReady) return;
    if (playbackRef.current.text !== text) {
      playbackRef.current = { text, started: false, completed: false };
    }
    const playback = playbackRef.current;
    node.textContent = text;
    const complete = () => {
      node.textContent = text;
      if (playback.completed) return;
      playback.completed = true;
      onCompleteRef.current?.();
    };
    if (!allowMotion || !playOnMount || speed <= 0 || !text || playback.started) {
      playback.started = true;
      complete();
      return;
    }
    playback.started = true;
    // The plugin prefers innerHTML on DOM nodes. A text-only proxy keeps
    // user-supplied characters literal throughout the effect, including '<'.
    const output = { nodeType: 1, textContent: text };
    const duration = gsap.utils.clamp(0.55, 1.6, (text.length + scramble) / (24 * speed * Math.max(step, 1)) + 0.3);
    gsap.to(output, {
      duration,
      delay: Math.max(0, delay) / 1000,
      ease: 'none',
      scrambleText: { text, chars: '01/_-', revealDelay: 0.12, speed, tweenLength: false },
      onUpdate: () => { node.textContent = output.textContent; },
      onComplete: complete,
    });
    return () => { node.textContent = text; };
  }, { scope: nodeRef, dependencies: [text, isReady, allowMotion, playOnMount, speed, scramble, step, delay], revertOnUpdate: true });

  return (
    <Tag
      ref={nodeRef as never}
      aria-label={text}
      className={className}
      style={{
        whiteSpace: 'pre-wrap',
        display: autoHeight ? 'block' : undefined,
        ...style,
      }}
    >
      {text}
    </Tag>
  );
});

export default DecodeText;
