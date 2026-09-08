'use client';
import { useId, useRef, type RefObject } from 'react';
import type { Artist, TerminalEvent } from '@/lib/events/types';
import { useLang } from '@/lib/langContext';
import TerminalButton from '@/components/TerminalButton';
import TerminalActionLink from '@/components/TerminalActionLink';
import { getArtistStatusLabel } from './ArtistRow';
import { gsap, useGSAP, revealTerminalReadout } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './ArtistProfile.module.css';

const WAVE = Array.from({ length: 9 }, (_, row) => Array.from({ length: 72 }, (_, col) => {
  const amplitude = Math.abs(Math.sin(col * 0.19) * Math.cos(col * 0.07)) * 4;
  return Math.abs(row - 4) <= amplitude ? (col % 4 === 0 ? '▓' : '│') : ' ';
}).join('')).join('\n');

export default function ArtistProfile({ artist, event, onReturn, headingRef }: {
  artist: Artist; event: TerminalEvent; onReturn: () => void; headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { lang } = useLang();
  const titleId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const { allowMotion } = useMotionPolicy();
  const description = typeof artist.description === 'object' && !Array.isArray(artist.description) ? artist.description[lang] : artist.description;
  const lines = (Array.isArray(description) ? description : description?.split('\n') ?? []).filter(line => line.trim());
  useGSAP(() => {
    if (!allowMotion) return;
    gsap.from('[data-profile-rule]', { scaleX: 0, duration: 0.18, ease: 'steps(6)' });
    gsap.fromTo('[data-profile-scan]', { scaleX: 0, opacity: 0.12 }, { scaleX: 1, opacity: 0, duration: 0.24, ease: 'steps(8)' });
    return revealTerminalReadout(rootRef.current, '[data-profile-content]');
  }, { scope: rootRef, dependencies: [allowMotion, artist.id], revertOnUpdate: true });

  return <section ref={rootRef} aria-labelledby={titleId} className={styles.profile} onKeyDown={e => { if (e.key === 'Escape') onReturn(); }}>
    <div className={styles.profileHeader}><span aria-hidden="true">ARTIST_PROFILE</span><TerminalButton variant="ghost" onClick={onReturn}>{lang === 'ko' ? '명단으로' : 'Back to list'}</TerminalButton></div>
    <div aria-hidden="true" className={styles.waveform}><pre>{WAVE}</pre><span data-profile-scan className={styles.scan} /><span data-profile-rule className={styles.rule} /></div>
    <div className={styles.body} data-profile-content>
      <h2 ref={headingRef} id={titleId} tabIndex={-1}>{artist.name}</h2>
      <dl className={styles.data}>
        <div><dt>{lang === 'ko' ? '출연 시간' : 'Set time'}</dt><dd>{artist.time}</dd></div>
        <div><dt>{lang === 'ko' ? '출신' : 'Origin'}</dt><dd>{artist.origin}</dd></div>
        <div><dt>DOCK</dt><dd>{artist.dock}</dd></div>
        <div><dt>{lang === 'ko' ? '출연 상태' : 'Status'}</dt><dd>{getArtistStatusLabel(artist.status, lang)}</dd></div>
      </dl>
      {lines.length > 0 && <div className={styles.biography}><h3>{lang === 'ko' ? '아티스트 소개' : 'Biography'}</h3>{lines.map((line, i) => <p key={i}>{line}</p>)}</div>}
      <div className={styles.event}><p>{event.session}</p><TerminalActionLink variant="ghost" href={`/gate?event=${encodeURIComponent(event.id)}`}>{lang === 'ko' ? '이 행사 보기' : 'Explore this event'}</TerminalActionLink></div>
    </div>
  </section>;
}
