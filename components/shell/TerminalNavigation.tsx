'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import LangToggle from '@/components/ui/LangToggle';
import { useLang } from '@/lib/langContext';
import { useControlMotion } from '@/components/ui/useControlMotion';
import styles from './TerminalNavigation.module.css';

const DIRECTORY = [
  { href: '/gate', code: 'GATE', ko: '이벤트', en: 'Events' },
  { href: '/lineup', code: 'LINEUP', ko: '라인업', en: 'Lineup' },
  { href: '/gate/request', code: 'GUEST_REQ', ko: '게스트 신청', en: 'Guest request' },
  { href: '/status', code: 'STATUS', ko: '이벤트 기록', en: 'Event history' },
  { href: '/transmit', code: 'TRANSMIT', ko: '방명록', en: 'Guestbook' },
  { href: '/signal', code: 'SIGNAL', ko: '소식 신청', en: 'Event updates' },
  { href: '/about', code: 'ABOUT', ko: '소개', en: 'About' },
] as const;

export function getActiveDirectory(pathname: string | null) {
  return DIRECTORY.filter(item => pathname === item.href || pathname?.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function DirectoryItem({ item, index, current, onNavigate }: {
  item: typeof DIRECTORY[number]; index: number; current: boolean; onNavigate: () => void;
}) {
  const { lang } = useLang();
  const ref = useControlMotion<HTMLAnchorElement>();
  return <li className={styles.item}>
    <Link ref={ref} href={item.href} onClick={onNavigate} aria-current={current ? 'page' : undefined} className={styles.link}>
      <span aria-hidden="true" data-control-scan className={styles.scan} />
      <span data-control-label className={styles.label}>
        <span aria-hidden="true" className={styles.code}><span>[{String(index + 1).padStart(2, '0')}]</span> {item.code}</span>
        <span className={styles.name}>{item[lang]}</span>
      </span>
      <span aria-hidden="true" data-control-arrow className={styles.marker}>[+]</span>
    </Link>
  </li>;
}

export default function TerminalNavigation({ pathname }: { pathname: string | null }) {
  const { lang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const secondaryId = useId();
  const menuRef = useRef<HTMLButtonElement>(null);
  const secondaryRef = useRef<HTMLUListElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const current = getActiveDirectory(pathname);
  const closeMenu = (destination: string) => {
    if (isOpen && pathname === destination) menuRef.current?.focus();
    setIsOpen(false);
  };

  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)');
    const resize = () => {
      if (media.matches && document.activeElement === menuRef.current) brandRef.current?.focus();
      if (!media.matches && secondaryRef.current?.contains(document.activeElement)) menuRef.current?.focus();
      setIsOpen(false);
    };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);

  return <header className={styles.header} onKeyDown={event => {
    if (event.key === 'Escape' && isOpen) { setIsOpen(false); menuRef.current?.focus(); }
  }}>
    <div className={styles.rail}>
      <Link ref={brandRef} data-shell="brand" href="/home" className={styles.brand} aria-current={pathname === '/' || pathname === '/home' ? 'page' : undefined}>TERMINAL<span aria-hidden="true" className={styles.location}>{' // SEOUL'}</span></Link>
      <div className={styles.utilities}>
        <Link href="/link" className={styles.channels} aria-current={pathname === '/link' ? 'page' : undefined}>{lang === 'ko' ? '공식 채널' : 'Official channels'} <span aria-hidden="true">↗</span></Link>
        <div data-shell="language"><LangToggle className={styles.language} /></div>
        <button ref={menuRef} type="button" className={styles.menu} aria-expanded={isOpen} aria-controls={secondaryId} onClick={() => setIsOpen(open => !open)}>
          {lang === 'ko' ? '메뉴' : 'Menu'} <span aria-hidden="true">[{isOpen ? '−' : '+'}]</span>
        </button>
      </div>
    </div>
    <nav data-shell="navigation" aria-label={lang === 'ko' ? '주요 메뉴' : 'Main navigation'} className={styles.navigation}>
      <ul className={styles.core}>{DIRECTORY.slice(0, 3).map((item, index) => <DirectoryItem key={item.href} item={item} index={index} current={current?.href === item.href} onNavigate={() => closeMenu(item.href)} />)}</ul>
      <ul ref={secondaryRef} id={secondaryId} className={styles.secondary} data-open={isOpen}>
        {DIRECTORY.slice(3).map((item, index) => <DirectoryItem key={item.href} item={item} index={index + 3} current={current?.href === item.href} onNavigate={() => closeMenu(item.href)} />)}
        <li className={styles.mobileChannels}><Link href="/link" onClick={() => closeMenu('/link')} aria-current={pathname === '/link' ? 'page' : undefined}>{lang === 'ko' ? '공식 채널' : 'Official channels'} <span aria-hidden="true">↗</span></Link></li>
      </ul>
    </nav>
    <span aria-hidden="true" data-shell="line" className={styles.rule} />
  </header>;
}
