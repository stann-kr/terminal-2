'use client';
import React, { ReactNode, useId, useRef } from 'react';
import { LabelText } from './ui/TerminalText';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';

interface TerminalPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  accent?: 'primary' | 'secondary' | 'tertiary' | 'alert' | 'warn';
  /** Titled panels default to h2; choose h3 when the panel is nested under an h2. */
  headingLevel?: 2 | 3;
}

const accentClassMap = {
  primary:   { border: 'border-terminal-accent-primary/40', title: 'text-terminal-accent-primary', glow: 'shadow-[0_0_24px_rgb(var(--color-accent-primary)/0.1),inset_0_0_16px_rgba(0,0,0,0.5)]' },
  secondary: { border: 'border-terminal-accent-secondary/40', title: 'text-terminal-accent-secondary', glow: 'shadow-[0_0_24px_rgb(var(--color-accent-secondary)/0.1),inset_0_0_16px_rgba(0,0,0,0.5)]' },
  tertiary:  { border: 'border-terminal-accent-tertiary/40', title: 'text-terminal-accent-tertiary', glow: 'shadow-[0_0_24px_rgb(var(--color-accent-tertiary)/0.1),inset_0_0_16px_rgba(0,0,0,0.5)]' },
  alert:     { border: 'border-terminal-accent-alert/40',  title: 'text-terminal-accent-alert', glow: 'shadow-[0_0_24px_rgb(var(--color-accent-alert)/0.1),inset_0_0_16px_rgba(0,0,0,0.5)]' },
  warn:      { border: 'border-terminal-accent-warn/40', title: 'text-terminal-accent-warn', glow: 'shadow-[0_0_24px_rgb(var(--color-accent-warn)/0.1),inset_0_0_16px_rgba(0,0,0,0.5)]' },
};

export default function TerminalPanel({
  children,
  className = '',
  title,
  accent = 'primary',
  headingLevel = 2,
}: TerminalPanelProps) {
  const generatedTitleId = useId();
  const classes = accentClassMap[accent] || accentClassMap.primary;
  const hasSemanticTitle = Boolean(title);
  const RootTag = hasSemanticTitle ? 'section' : 'div';
  const TitleTag = headingLevel === 3 ? 'h3' : 'h2';
  const titleId = hasSemanticTitle ? generatedTitleId : undefined;
  const rootRef = useRef<HTMLElement | null>(null);
  const { allowMotion } = useMotionPolicy();
  useGSAP(() => {
    if (!allowMotion || !rootRef.current) return;
    gsap.from('[data-panel="line"]', {
      scaleX: 0, duration: 0.85, ease: 'expo.out',
      scrollTrigger: { trigger: rootRef.current, start: 'top 96%', once: true },
    });
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });

  return (
    <RootTag
      ref={(node) => { rootRef.current = node; }}
      aria-labelledby={titleId}
      className={`relative border-t border-terminal-bg-panel-border ${className}`}
    >
      <span aria-hidden="true" data-panel="line" className="absolute top-0 left-0 w-full h-px bg-terminal-accent-primary/40 origin-left pointer-events-none" />
      {title && (
        <TitleTag
          id={titleId}
          className="pt-4 pb-3 flex items-baseline gap-3 font-mono border-b border-terminal-bg-panel-border/60"
        >
          <span aria-hidden="true" className="text-small text-terminal-subdued">&gt;</span>
          <LabelText
            text={title}
            autoHeight
            className={`text-body font-semibold ${classes.title}`}
          />
        </TitleTag>
      )}
      <div className="py-4">{children}</div>
    </RootTag>
  );
}
