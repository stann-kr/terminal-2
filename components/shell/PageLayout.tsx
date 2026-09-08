'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import SignalNet from './SignalNet';
import TerminalNavigation, { getActiveDirectory } from './TerminalNavigation';
import { useLang } from '@/lib/langContext';
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
  const current = getActiveDirectory(pathname);
  const currentLabel = pathname === '/link' ? (lang === 'ko' ? '공식 채널' : 'Official channels') : current?.[lang] ?? (lang === 'ko' ? '홈' : 'Home');
  return <div className={styles.page}>
    <TerminalNavigation pathname={pathname} />
    <main id="main-content" data-scroll-region tabIndex={-1} className={`${styles.content} ${flush ? styles.flush : styles[width]} ${centerContent ? styles.centered : ''}`}>
      {children}
    </main>
    <footer className={styles.footer}>
      <SignalNet />
      <p className={styles.current}><span aria-hidden="true">&gt; </span>{currentLabel}<span aria-hidden="true" className={styles.cursor} /></p>
    </footer>
  </div>;
}
