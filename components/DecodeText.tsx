'use client';

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useScramble } from 'use-scramble';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

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
  const [completedDelay, setCompletedDelay] = useState(0);
  const [completedText, setCompletedText] = useState<string | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);
  const playbackRef = useRef({ text, started: false, completed: false });
  const delayElapsed = delay <= 0 || completedDelay === delay;
  const motionEnabled = allowMotion && delayElapsed && playOnMount && completedText !== text;

  const complete = useCallback(() => {
    const playback = playbackRef.current;
    if (playback.text !== text || !playback.started || playback.completed) return;
    playback.completed = true;
    setCompletedText(text);
    onComplete?.();
  }, [onComplete, text]);

  const { ref: scrambleRef, replay } = useScramble({
    text,
    speed: motionEnabled ? speed : 0,
    scramble,
    step,
    range: [48, 102],
    overdrive: false,
    overflow: true,
    playOnMount: false,
    onAnimationEnd: complete,
  });
  const scrambleNodeRef = scrambleRef as { current: HTMLElement | null };
  const replayRef = useRef(replay);

  useEffect(() => { replayRef.current = replay; });

  useEffect(() => {
    if (delay <= 0) return;
    const timer = window.setTimeout(() => setCompletedDelay(delay), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (playbackRef.current.text !== text) {
      playbackRef.current = { text, started: false, completed: false };
    }
    if (!isReady) return;

    if (!allowMotion || !playOnMount || completedText === text) {
      if (nodeRef.current) nodeRef.current.textContent = text;
      playbackRef.current.started = true;
      // Freeze the external animation before another frame can overwrite the final text.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      complete();
      return;
    }

    if (!delayElapsed) return;

    // use-scramble mounts in its final state for SSR. Start explicitly once
    // policy is ready; returning to a visible tab must not replay the title.
    if (!playbackRef.current.started) {
      playbackRef.current.started = true;
      replayRef.current();
    }
  }, [allowMotion, complete, completedText, delayElapsed, isReady, playOnMount, text]);

  const setTagRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
    scrambleNodeRef.current = node;
  }, [scrambleNodeRef]);

  return (
    <Tag
      ref={setTagRef as never}
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
