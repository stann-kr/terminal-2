'use client';
import { useRef } from 'react';
import type { Artist, ArtistStatus } from '@/lib/events/types';
import { useLang } from '@/lib/langContext';
import { useControlMotion } from '@/components/ui/useControlMotion';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './ArtistRow.module.css';

const STATUS_LABELS: Record<'ko' | 'en', Record<ArtistStatus, string>> = {
  ko: { CONFIRMED: '출연 확정', CLASSIFIED: '추후 공개', PENDING: '확인 중', ARCHIVED: '지난 출연', 'AWAITING DECRYPTION': '추후 공개' },
  en: { CONFIRMED: 'Confirmed', CLASSIFIED: 'To be announced', PENDING: 'Pending', ARCHIVED: 'Past performance', 'AWAITING DECRYPTION': 'To be announced' },
};
export function getArtistStatusLabel(status: ArtistStatus, lang: 'ko' | 'en') { return STATUS_LABELS[lang][status]; }
export function getArtistTriggerId(id: string) { return `lineup-artist-${encodeURIComponent(id)}`; }

export default function ArtistRow({ artist, index = 0, selected, onSelect, profileId }: {
  artist: Artist; index?: number; selected: boolean; onSelect: () => void; profileId: string;
}) {
  const { lang } = useLang();
  const rootRef = useControlMotion<HTMLButtonElement>();
  const hasEntered = useRef(false);
  const { allowMotion } = useMotionPolicy();
  useGSAP(() => {
    if (!allowMotion || hasEntered.current) return;
    gsap.from(rootRef.current, {
      x: 14, opacity: 0.65, duration: 0.55, delay: Math.min(index, 5) * 0.045, ease: 'expo.out',
      scrollTrigger: { trigger: rootRef.current, scroller: rootRef.current?.closest<HTMLElement>('[data-scroll-region]') ?? undefined, start: 'top 97%', once: true },
      onStart: () => { hasEntered.current = true; }, clearProps: 'transform,opacity',
    });
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });

  return <button ref={rootRef} id={getArtistTriggerId(artist.id)} type="button" className={styles.row} aria-pressed={selected} aria-controls={profileId} onClick={onSelect}>
    <span aria-hidden="true" data-control-scan className={styles.scan} />
    <span aria-hidden="true" className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
    <span data-control-label className={styles.name}>{artist.name}</span>
    <span className={styles.time}>{artist.time}</span>
    <span className={styles.metadata}>{artist.origin} · {getArtistStatusLabel(artist.status, lang)}</span>
    <span aria-hidden="true" data-control-arrow className={styles.indicator}>{selected ? '−' : '+'}</span>
  </button>;
}
