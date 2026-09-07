'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/animationTokens';
import SignalNet from './SignalNet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LangToggle from '@/components/ui/LangToggle';
import { useLang } from '@/lib/langContext';
import styles from './PageLayout.module.css';

// re-export: 기존 import 경로 유지 (PageLayout에서 import하는 파일 무변경)
export { containerVariants, itemVariants };

interface PageLayoutProps {
  children: React.ReactNode;
  /**
   * false: 수직 중앙 정렬 비활성화 (긴 폼 등 tall 페이지용).
   * true: md 이상에서 my-auto로 수직 중앙 정렬.
   */
  centerContent?: boolean;
  width?: 'event' | 'reading' | 'form';
}

export default function PageLayout({ children, centerContent = false, width = 'reading' }: PageLayoutProps) {
  const { lang } = useLang();
  const pathname = usePathname();
  const navigation = [
    { href: '/gate', label: lang === 'ko' ? '이벤트' : 'Events' },
    { href: '/lineup', label: lang === 'ko' ? '라인업' : 'Lineup' },
  ];
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`relative w-full min-h-screen flex flex-col items-center text-terminal-primary px-5 sm:px-8 py-6 sm:py-8 ${styles.page}`}
    >
      <motion.div
        className={`relative z-10 w-full flex flex-col mx-auto shrink-0 ${styles[width]}${centerContent ? ' md:my-auto' : ''}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <header className={styles.header}>
          <Link href="/home" className={styles.brand} aria-current={pathname === '/home' || pathname === '/' ? 'page' : undefined}>TERMINAL</Link>
          <nav aria-label={lang === 'ko' ? '주요 메뉴' : 'Main navigation'} className={styles.navigation}>
            {navigation.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={styles.navLink}
                aria-current={pathname === href ? 'page' : pathname?.startsWith(`${href}/`) ? 'location' : undefined}
              >
                <span aria-hidden="true" className={styles.navMarker}>&gt;</span>
                {label}
              </Link>
            ))}
          </nav>
          <LangToggle className={styles.language} />
        </header>
        {children}

        <div className={styles.footer}>
          <SignalNet />
        </div>
      </motion.div>
    </main>
  );
}
