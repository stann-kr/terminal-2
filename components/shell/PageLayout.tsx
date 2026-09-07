'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/animationTokens';
import SignalNet from './SignalNet';
import Link from 'next/link';
import LangToggle from '@/components/ui/LangToggle';
import { useLang } from '@/lib/langContext';
import styles from './PageLayout.module.css';

// re-export: 기존 import 경로 유지 (PageLayout에서 import하는 파일 무변경)
export { containerVariants, itemVariants };

interface PageLayoutProps {
  children: React.ReactNode;
  /**
   * false: 수직 중앙 정렬 비활성화 (긴 폼 등 tall 페이지용).
   * true(기본값): md 이상에서 my-auto로 수직 중앙 정렬.
   */
  centerContent?: boolean;
  width?: 'event' | 'reading' | 'form';
}

export default function PageLayout({ children, centerContent = false, width = 'reading' }: PageLayoutProps) {
  const { lang } = useLang();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full min-h-screen flex flex-col items-center text-terminal-primary px-5 sm:px-8 py-6 sm:py-8"
    >
      <motion.div
        className={`relative z-10 w-full flex flex-col mx-auto shrink-0 ${styles[width]}${centerContent ? ' md:my-auto' : ''}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-5 mb-8 border-b border-terminal-bg-panel-border">
          <Link href="/home" className="font-pixie text-h2 tracking-wider min-h-11 inline-flex items-center">TERMINAL</Link>
          <nav aria-label={lang === 'ko' ? '주요 메뉴' : 'Main navigation'} className="flex items-center flex-wrap gap-4 text-small">
            <Link href="/gate" className="min-h-11 inline-flex items-center">{lang === 'ko' ? '이벤트' : 'Events'}</Link>
            <Link href="/lineup" className="min-h-11 inline-flex items-center">{lang === 'ko' ? '라인업' : 'Lineup'}</Link>
            <LangToggle />
          </nav>
        </header>
        {children}

        <div className="mt-12 border-t border-terminal-bg-panel-border/40 pt-4">
          <SignalNet />
        </div>
      </motion.div>
    </main>
  );
}
