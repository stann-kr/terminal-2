'use client';
import { useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import SignalNet from './SignalNet';
import TerminalNavigation, { getActiveDirectory } from './TerminalNavigation';
import { useLang } from '@/lib/langContext';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './PageLayout.module.css';

export { containerVariants, itemVariants } from '@/lib/animationTokens';

interface PageLayoutProps {
  children: ReactNode;
  centerContent?: boolean;
  width?: 'event' | 'reading' | 'form';
  flush?: boolean;
}

export default function PageLayout({ children, centerContent = false, width = 'reading', flush = false }: PageLayoutProps) {
  const pathname = usePathname();
  const { lang } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const { allowMotion } = useMotionPolicy();
  const current = getActiveDirectory(pathname);
  useGSAP(() => {
    if (!allowMotion) return;
    gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.65 } })
      .from('[data-shell="line"]', { scaleX: 0, duration: 0.9 }, 0)
      .from('[data-shell="brand"]', { x: -12, opacity: 0.6 }, 0.04)
      .from('[data-shell="navigation"], [data-shell="language"]', { y: -8, opacity: 0.65, stagger: 0.06 }, 0.1);
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });

  return <div ref={rootRef} className={styles.page}>
    <TerminalNavigation pathname={pathname} />
    <main id="main-content" tabIndex={-1} className={`${styles.content} ${flush ? styles.flush : styles[width]} ${centerContent ? styles.centered : ''}`}>
      {children}
    </main>
    <footer className={styles.footer}>
      <SignalNet />
      <p className={styles.current}><span aria-hidden="true">&gt; </span>{current?.[lang] ?? (lang === 'ko' ? '홈' : 'Home')}<span aria-hidden="true" className={styles.cursor} /></p>
    </footer>
  </div>;
}
