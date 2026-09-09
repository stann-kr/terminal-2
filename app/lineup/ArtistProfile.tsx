'use client';
import { useId, useRef, type RefObject } from 'react';
import type { Artist } from '@/lib/events/types';
import { useLang } from '@/lib/langContext';
import TerminalButton from '@/components/TerminalButton';
import { getArtistStatusLabel } from './ArtistRow';
import { useGSAP, revealTerminalReadout } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './ArtistProfile.module.css';

export default function ArtistProfile({ artist, onReturn, headingRef }: {
  artist: Artist; onReturn: () => void; headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { lang } = useLang();
  const titleId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const { allowMotion } = useMotionPolicy();
  const description = typeof artist.description === 'object' && !Array.isArray(artist.description) ? artist.description[lang] : artist.description;
  const lines = (Array.isArray(description) ? description : description?.split('\n') ?? []).filter(line => line.trim());
  useGSAP(() => {
    if (!allowMotion) return;
    return revealTerminalReadout(rootRef.current, '[data-profile-content]');
  }, { scope: rootRef, dependencies: [allowMotion, artist.id], revertOnUpdate: true });

  return <section ref={rootRef} aria-labelledby={titleId} className={styles.profile} onKeyDown={e => { if (e.key === 'Escape') onReturn(); }}>
    <div className={styles.profileHeader}><TerminalButton variant="ghost" onClick={onReturn}>{lang === 'ko' ? '명단으로' : 'Back to list'}</TerminalButton></div>
    <div className={styles.body} data-profile-content>
      <h2 ref={headingRef} id={titleId} tabIndex={-1}>{artist.name}</h2>
      <dl className={styles.data}>
        <div><dt>{lang === 'ko' ? '출연 시간' : 'Set time'}</dt><dd>{artist.time}</dd></div>
        <div><dt>{lang === 'ko' ? '출신' : 'Origin'}</dt><dd>{artist.origin}</dd></div>
        <div><dt>{lang === 'ko' ? '스테이지' : 'Stage'}</dt><dd>{artist.dock}</dd></div>
        <div><dt>{lang === 'ko' ? '출연 상태' : 'Status'}</dt><dd>{getArtistStatusLabel(artist.status, lang)}</dd></div>
      </dl>
      {lines.length > 0 && <div className={styles.biography}><h3>{lang === 'ko' ? '아티스트 소개' : 'Biography'}</h3>{lines.map((line, i) => <p key={i}>{line}</p>)}</div>}
    </div>
  </section>;
}
