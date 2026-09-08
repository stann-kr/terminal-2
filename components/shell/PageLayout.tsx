'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import SignalNet from './SignalNet';
import TerminalNavigation, { getActiveDirectory } from './TerminalNavigation';
import { useLang } from '@/lib/langContext';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './PageLayout.module.css';
import { useTerminalScreen } from './useTerminalScreen';

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
  const { allowMotion } = useMotionPolicy();
  const screenRef = useTerminalScreen(pathname);
  const current = getActiveDirectory(pathname);
  const currentLabel = pathname === '/link' ? (lang === 'ko' ? '공식 채널' : 'Official channels') : current?.[lang] ?? (lang === 'ko' ? '홈' : 'Home');
  return <div className={styles.page}>
    <TerminalNavigation pathname={pathname} />
    <div ref={screenRef} className={styles.screen}>
      <main id="main-content" data-scroll-region tabIndex={-1} className={`${styles.content} ${flush ? styles.flush : styles[width]} ${centerContent ? styles.centered : ''}`}>
        {children}
      </main>
      <div aria-hidden="true" data-screen-curtain className={styles.curtain} />
      <div aria-hidden="true" data-screen-beam className={styles.beam} />
    </div>
    <footer className={styles.footer}>
      <SignalNet />
      <p className={styles.current}><span aria-hidden="true">&gt; </span>{currentLabel}<span aria-hidden="true" className={styles.cursor} data-motion={allowMotion} /></p>
    </footer>
  </div>;
}
