import { useEffect, useRef, useState, type ReactNode } from 'react';
import { href, pagePaths, type Lang, type Page, type Translate } from '../events/data';
import './shell.css';

const directory: { page: Page; code: string; ko: string; en: string }[] = [
  { page: 'gate', code: 'GATE', ko: '이벤트', en: 'Events' },
  { page: 'lineup', code: 'LINEUP', ko: '라인업', en: 'Lineup' },
  { page: 'request', code: 'GUEST_REQ', ko: '게스트 신청', en: 'Guest request' },
  { page: 'status', code: 'STATUS', ko: '이벤트 기록', en: 'History' },
  { page: 'transmit', code: 'TRANSMIT', ko: '방명록', en: 'Guestbook' },
  { page: 'signal', code: 'SIGNAL', ko: '소식 신청', en: 'Updates' },
  { page: 'about', code: 'ABOUT', ko: '소개', en: 'About' },
];

export function Shell({ page, viewKey, lang, t, setLang, crt, toggleCrt, children }: { page: Page; viewKey: string; lang: Lang; t: Translate; setLang: (lang: Lang) => void; crt: boolean; toggleCrt: () => void; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const lastPage = useRef(viewKey);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (lastPage.current !== viewKey) {
      mainRef.current?.scrollTo?.({ top: 0 });
      mainRef.current?.querySelector<HTMLElement>('[data-active="true"] h1')?.focus();
      lastPage.current = viewKey;
    }
  }, [viewKey]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 900px)');
    const close = () => {
      if (!media.matches && navigationRef.current?.contains(document.activeElement)) menuRef.current?.focus();
      if (media.matches && document.activeElement === menuRef.current) document.getElementById('tm-brand')?.focus();
      setMenu(false);
    };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  return <div className="tm-shell" data-crt={crt}>
    <a className="tm-skip" href="#tm-main" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>{t('본문으로 건너뛰기', 'Skip to content')}</a>
    <header className="tm-header" onKeyDown={e => { if (e.key === 'Escape' && menu) { setMenu(false); menuRef.current?.focus(); } }}>
      <div className="tm-topline"><a id="tm-brand" className="tm-brand" href={href('home')}>TERMINAL<span>{' // SEOUL'}</span></a><div className="tm-utilities"><a className="tm-channel-link" href={href('link')}>{t('공식 채널', 'Channels')}</a><button type="button" aria-label={t('CRT 화면 효과', 'CRT display effects')} aria-pressed={crt} onClick={toggleCrt}>CRT <span aria-hidden="true">{crt ? '■' : '□'}</span></button><button type="button" aria-label={t('영어로 보기', 'Switch to Korean')} onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}>{lang === 'ko' ? 'EN' : 'KO'}</button><button ref={menuRef} className="tm-menu-toggle" hidden={page === 'entry'} type="button" aria-expanded={menu} aria-controls="tm-navigation" onClick={() => setMenu(!menu)}>{t('메뉴', 'Menu')} [{menu ? '−' : '+'}]</button></div></div>
      <nav hidden={page === 'entry'} ref={navigationRef} id="tm-navigation" className="tm-navigation" data-open={menu} aria-label={t('주요 메뉴', 'Main navigation')}>
        {directory.map(item => <a key={item.page} href={href(item.page)} aria-current={page === item.page ? 'page' : undefined} onClick={() => { setMenu(false); if (page === item.page) menuRef.current?.focus(); }}><span className="tm-nav-code">{item.code}</span><span>{item[lang]}</span></a>)}
        <a className="tm-mobile-channels" href={href('link')} onClick={() => setMenu(false)}>{t('공식 채널', 'Channels')}</a>
      </nav>
      {page === 'entry' && <div className="tm-entry-rail"><span>TERMINAL EXPERIENCE</span><span>BOOT / IDLE</span></div>}
    </header>
    <main ref={mainRef} id="tm-main" tabIndex={-1} className="tm-main">{children}</main>
    <footer className="tm-footer"><span>STANN OS / LIVE</span><span className="tm-path">{pagePaths[page]}</span><a href={href('link')}>{t('공식 채널', 'Official channels')} ↗</a></footer>
    {crt && <div className="tm-glass" aria-hidden="true"><div className="tm-raster" /><div className="tm-reflection" /><div className="tm-vignette" /></div>}
  </div>;
}
