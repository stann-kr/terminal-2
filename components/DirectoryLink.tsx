'use client';
import Link from 'next/link';
import { useLang } from '@/lib/langContext';
import styles from './DirectoryLink.module.css';
import { useControlMotion } from './ui/useControlMotion';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import { useRef } from 'react';
interface DirectoryLinkProps {
  href: string; label: string; description: string; index: number;
  accent?: 'primary' | 'secondary' | 'warn' | 'alert' | 'tertiary'; external?: boolean;
}
export default function DirectoryLink({ href, label, description, index, external = false }: DirectoryLinkProps) {
  const { lang } = useLang();
  const rootRef = useControlMotion<HTMLAnchorElement>();
  const { allowMotion } = useMotionPolicy();
  const hasEntered = useRef(false);
  useGSAP(() => {
    if (!allowMotion || !rootRef.current || hasEntered.current) return;
    gsap.from(rootRef.current, {
      y: 18, opacity: 0.65, duration: 0.65, ease: 'expo.out',
      delay: Math.min(index - 1, 3) * 0.055,
      scrollTrigger: { trigger: rootRef.current, scroller: rootRef.current.closest<HTMLElement>('[data-scroll-region]') ?? undefined, start: 'top 96%', once: true },
      onStart: () => { hasEntered.current = true; },
      clearProps: 'transform,opacity',
    });
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });
  const content = (
    <>
      <span aria-hidden="true" data-control-scan className={styles.scan} />
      <span aria-hidden="true" data-control-rail className={styles.rail} />
      <span aria-hidden="true" className={styles.index}>{String(index).padStart(2, '0')}</span>
      <span data-control-label className={styles.label}>{label}</span>
      <span className={styles.description}>{description}</span>
      <span className={styles.action}>
        {external && <span>{lang === 'ko' ? '새 탭' : 'Open'}</span>}
        <span aria-hidden="true" data-control-arrow className={styles.arrow}>{external ? '↗' : '↵'}</span>
      </span>
    </>
  );
  const className = styles.link;
  return external ? <a ref={rootRef} href={href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a> : <Link ref={rootRef} href={href} className={className}>{content}</Link>;
}
