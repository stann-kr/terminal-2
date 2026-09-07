'use client';
import { useId, useRef, useState } from 'react';
import type { Artist, ArtistStatus } from '@/lib/events/types';
import { useLang, useT } from '@/lib/langContext';
import AnimatedHeight from '@/components/ui/AnimatedHeight';
import styles from './ArtistRow.module.css';

const statusLabels: Record<'ko' | 'en', Record<ArtistStatus, string>> = {
  ko: {
    CONFIRMED: '출연 확정',
    CLASSIFIED: '추후 공개',
    PENDING: '확인 중',
    ARCHIVED: '지난 출연',
    'AWAITING DECRYPTION': '추후 공개',
  },
  en: {
    CONFIRMED: 'Confirmed',
    CLASSIFIED: 'To be announced',
    PENDING: 'Pending',
    ARCHIVED: 'Past performance',
    'AWAITING DECRYPTION': 'To be announced',
  },
};

interface Props { artist: Artist; }

export default function ArtistRow({ artist }: Props) {
  const { lang } = useLang();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const description = typeof artist.description === 'object' && !Array.isArray(artist.description)
    ? artist.description[lang]
    : artist.description;
  const descriptionLines = Array.isArray(description) ? description : description?.split('\n') ?? [];
  const hasDescription = descriptionLines.some((line) => line.trim().length > 0);

  const toggleDescription = () => {
    if (isOpen && descriptionRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus();
    }
    setIsOpen((open) => !open);
  };

  const summary = (
    <>
      <span className={styles.name}>{artist.name}</span>
      <span className={styles.time}>{artist.time}</span>
      <span className={styles.metadata}>
        <span>{statusLabels[lang][artist.status]}</span>
        <span>{artist.origin} · {t.lineup.dock(artist.dock)}</span>
        <span className="font-mono text-caption">{artist.id}</span>
      </span>
      {hasDescription && <span aria-hidden="true" className={styles.indicator}><span /><span /></span>}
    </>
  );

  return (
    <div className={styles.row} data-open={isOpen}>
      {hasDescription ? (
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={descriptionId}
          onClick={toggleDescription}
          className={`${styles.summary} ${styles.trigger}`}
        >
          {summary}
        </button>
      ) : <div className={styles.summary}>{summary}</div>}

      {hasDescription && (
        <AnimatedHeight id={descriptionId} show={isOpen}>
          <div ref={descriptionRef} className={`${styles.description} space-y-2`}>
            {descriptionLines.map((line, index) => <p key={index} className="min-h-[1.6em]">{line || '\u00a0'}</p>)}
          </div>
        </AnimatedHeight>
      )}
    </div>
  );
}
