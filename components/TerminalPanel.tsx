'use client';
import { useId, useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './TerminalPanel.module.css';

interface TerminalPanelProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  title?: string;
  accent?: 'primary' | 'secondary' | 'tertiary' | 'alert' | 'warn';
  headingLevel?: 2 | 3;
}

export default function TerminalPanel({ children, className = '', bodyClassName = '', title, accent = 'primary', headingLevel = 2 }: TerminalPanelProps) {
  const titleId = useId();
  const RootTag = title ? 'section' : 'div';
  const TitleTag = headingLevel === 3 ? 'h3' : 'h2';
  const rootRef = useRef<HTMLElement | null>(null);
  const { allowMotion } = useMotionPolicy();
  useGSAP(() => {
    if (!allowMotion) return;
    gsap.from('[data-panel="line"]', { scaleX: 0, duration: 0.75, ease: 'expo.out', scrollTrigger: { trigger: rootRef.current, start: 'top 96%', once: true } });
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });

  return <RootTag ref={node => { rootRef.current = node; }} aria-labelledby={title ? titleId : undefined} data-accent={accent} className={`${styles.panel} ${className}`}>
    <span aria-hidden="true" data-panel="line" className={styles.rule} />
    {title && <TitleTag id={titleId} className={styles.heading}>{title}<span aria-hidden="true">[+]</span></TitleTag>}
    <div className={`${styles.body} ${bodyClassName}`}>{children}</div>
  </RootTag>;
}
