'use client';

import Link from 'next/link';
import { useLang } from '@/lib/langContext';
import { manifestoKo, manifestoEn, linkKo, linkEn } from '@/lib/i18n';
import { href, isPublicArtist, type ScreenProps } from '../events/data';
import { Action, PageHeading } from '../shared/Ui';
import { TerminalText } from '../motion/TerminalText';
import './info.css';

export function Status({ events, t }: ScreenProps) {
  const archived = events.filter(event => event.status === 'ARCHIVED');
  const years = [...new Set(archived.map(event => event.date.slice(0, 4)))];
  return <><PageHeading code="STATUS / EVENT HISTORY" title={t('이벤트 기록', 'Event history')} />{years.length ? years.map(year => <section key={year} className="tm-history-year"><h2 data-motion-title className="tm-cell"><TerminalText>{year}</TerminalText></h2><div>{archived.filter(event => event.date.startsWith(year)).map(event => <Link key={event.id} href={href('gate', event.id)} className="tm-history-entry"><div data-motion-copy><span className="tm-eyebrow">{event.id}</span><h3>{event.session}</h3><p>{event.subtitle}</p></div><div><p>{event.date}</p><p>{event.venue}</p></div><div><span className="tm-eyebrow">LINEUP</span><p>{event.artists.filter(isPublicArtist).map(artist => artist.name).join(' / ')}</p></div></Link>)}</div></section>) : <p className="tm-cell" role="status">{t('기록된 이벤트가 없습니다.', 'No event history.')}</p>}</>;
}

export function About() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => lang === 'ko' ? ko : en;
  const manifesto = lang === 'ko' ? manifestoKo : manifestoEn;
  return <><PageHeading code="ABOUT / TERMINAL" title={t('TERMINAL 소개', 'About TERMINAL')} /><div className="tm-about"><section className="tm-about-identity tm-cell"><p className="tm-eyebrow">SEOUL / TECHNO PLATFORM</p><p data-motion-title className="tm-about-wordmark" aria-hidden="true">TER<br />MINAL</p><h2 data-motion-copy>{manifesto[0]}</h2></section><section className="tm-about-copy tm-cell"><div className="tm-prose">{manifesto.slice(1).map((line, i) => <p data-motion-copy key={i}>{line}</p>)}</div><div className="tm-action-group"><Action page="gate">{t('이벤트 보기', 'Explore events')}</Action><Action page="link" secondary>{t('공식 채널', 'Official channels')}</Action><Link className="tm-text-link" href={href('entry')}><span>{t('터미널 체험', 'Terminal experience')}</span></Link></div></section></div></>;
}

export function Channels() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => lang === 'ko' ? ko : en;
  const copy = lang === 'ko' ? linkKo : linkEn;
  const links = [
    { href: 'https://stann.kr', title: 'STANN OS HUB', description: copy.descriptions.stannHub },
    { href: 'https://lumo.stann.kr', title: 'STANN LUMO WEB', description: copy.descriptions.stannWeb },
    { href: 'https://www.instagram.com/stannlumo/', title: 'STANN LUMO INSTAGRAM', description: copy.descriptions.stannInsta },
    { href: 'https://www.instagram.com/terminal_hub/', title: 'TERMINAL INSTAGRAM', description: copy.descriptions.terminalInsta },
  ];
  return <><PageHeading code="LINK / EXTERNAL CHANNELS" title={t('공식 채널', 'Official channels')} /><nav className="tm-channels" aria-label={t('공식 채널', 'Official channels')}>{links.map((link, index) => <a href={link.href} key={link.href} target="_blank" rel="noopener noreferrer"><span className="tm-eyebrow">[{String(index + 1).padStart(2, '0')}]</span><div><h2 data-motion-title><TerminalText>{link.title}</TerminalText></h2><p data-motion-copy>{link.description}<span className="tm-sr-only"> · {t('새 탭에서 열기', 'Opens in a new tab')}</span></p></div></a>)}</nav></>;
}
