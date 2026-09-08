'use client';
import type { Variants } from 'framer-motion';
import { useRef } from 'react';
import { HeadingText } from '@/components/ui/TerminalText';
import styles from './PageHeader.module.css';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

interface PageHeaderProps {
  path: string;
  title: string;
  accent?: 'primary' | 'secondary' | 'alert' | 'warn' | 'tertiary';
  variants?: Variants;
  cipher?: boolean;
}

const accentClassMap: Record<NonNullable<PageHeaderProps['accent']>, string> = {
  primary:   'text-terminal-accent-primary text-shadow-glow-primary',
  secondary: 'text-terminal-accent-secondary text-shadow-glow-secondary',
  alert:     'text-terminal-accent-alert text-shadow-glow-alert',
  warn:      'text-terminal-accent-warn text-shadow-glow-warn',
  tertiary:  'text-terminal-accent-tertiary text-shadow-glow-tertiary',
};

export default function PageHeader({ path, title, accent = 'primary', cipher = false }: PageHeaderProps) {
  const accentClass = accentClassMap[accent] || accentClassMap.primary;
  const rootRef = useRef<HTMLDivElement>(null);
  const hasEntered = useRef(false);
  const { allowMotion } = useMotionPolicy();
  useGSAP(() => {
    if (!allowMotion || hasEntered.current) return;
    hasEntered.current = true;
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('[data-heading="path"]', { x: -16, opacity: 0.45, duration: 0.55 }, 0)
      .from('h1', { y: 20, opacity: 0.55, duration: 0.8 }, 0.08)
      .from('[data-heading="rule"]', { scaleX: 0, duration: 0.8 }, 0.16);
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });
  return (
    <div ref={rootRef} className={styles.header}>
      <p data-heading="path" aria-hidden="true" className={styles.path}><span>&gt; {path.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, '_').toUpperCase()}</span><span>[TERMINAL]</span></p>
      <HeadingText
        text={title}
        cipher={cipher}
        autoHeight
        className={`font-mono text-h1 tracking-normal ${accent === 'alert' || accent === 'warn' ? accentClass.split(' ')[0] : 'text-terminal-primary'} ${styles.title}`}
      />
      <span aria-hidden="true" data-heading="rule" className={styles.rule} />
    </div>
  );
}
