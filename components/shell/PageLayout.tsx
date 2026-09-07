'use client';
import React, { useRef } from 'react';
import { containerVariants, itemVariants } from '@/lib/animationTokens';
import SignalNet from './SignalNet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LangToggle from '@/components/ui/LangToggle';
import { useLang } from '@/lib/langContext';
import styles from './PageLayout.module.css';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import { useControlMotion } from '@/components/ui/useControlMotion';

// re-export: 기존 import 경로 유지 (PageLayout에서 import하는 파일 무변경)
export { containerVariants, itemVariants };

function NavigationLink({ href, label, pathname }: { href: string; label: string; pathname: string | null }) {
  const rootRef = useControlMotion<HTMLAnchorElement>();
  return <Link ref={rootRef} href={href} className={styles.navLink} aria-current={pathname === href ? 'page' : pathname?.startsWith(`${href}/`) ? 'location' : undefined}>
    <span aria-hidden="true" data-control-scan className={styles.navScan} />
    <span aria-hidden="true" data-control-arrow className={styles.navMarker}>&gt;</span>
    <span data-control-label>{label}</span>
  </Link>;
}

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
  const rootRef = useRef<HTMLDivElement>(null);
  const hasEntered = useRef(false);
  const { allowMotion } = useMotionPolicy();
  useGSAP(() => {
    if (!allowMotion) return;
    if (!hasEntered.current) {
      hasEntered.current = true;
      gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.65 } })
        .from('[data-shell="line"]', { scaleX: 0, duration: 0.9 }, 0)
        .from('[data-shell="brand"]', { x: -12, opacity: 0.5 }, 0.04)
        .from('[data-shell="navigation"], [data-shell="language"]', { y: -10, opacity: 0.6, stagger: 0.08 }, 0.12);
    }
    gsap.fromTo('[data-shell="trace"]', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.35 },
    });
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });
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
      <div
        ref={rootRef}
        className={`relative z-10 w-full flex flex-col mx-auto shrink-0 ${styles[width]}${centerContent ? ' md:my-auto' : ''}`}
      >
        <span aria-hidden="true" data-shell="trace" className={styles.trace} />
        <header className={styles.header}>
          <span aria-hidden="true" data-shell="line" className={styles.line} />
          <Link data-shell="brand" href="/home" className={styles.brand} aria-current={pathname === '/home' || pathname === '/' ? 'page' : undefined}>TERMINAL</Link>
          <nav data-shell="navigation" aria-label={lang === 'ko' ? '주요 메뉴' : 'Main navigation'} className={styles.navigation}>
            {navigation.map(({ href, label }) => (
              <NavigationLink key={href} href={href} label={label} pathname={pathname} />
            ))}
          </nav>
          <div data-shell="language" className={styles.language}><LangToggle /></div>
        </header>
        {children}

        <div className={styles.footer}>
          <SignalNet />
        </div>
      </div>
    </main>
  );
}
