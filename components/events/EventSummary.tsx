'use client';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { TerminalEvent } from '@/lib/events/types';
import { formatEventDate } from '@/lib/events/lifecycle';
import { useLang } from '@/lib/langContext';
import styles from './EventSummary.module.css';

export default function EventSummary({ event, children }: { event: TerminalEvent; children?: ReactNode }) {
  const { lang } = useLang();
  const status = lang === 'ko'
    ? { LIVE: '진행 중', UPCOMING: '예정된 이벤트', ARCHIVED: '지난 이벤트' }[event.status]
    : { LIVE: 'Live now', UPCOMING: 'Upcoming event', ARCHIVED: 'Past event' }[event.status];
  return (
    <section className={`${styles.summary} ${event.posterUrl ? styles.withPoster : ''}`} aria-labelledby="event-title">
      <div className={styles.information}>
        <p className="text-small text-terminal-subdued mb-4">{status}</p>
        <h1 id="event-title" className={styles.title}>{event.session}</h1>
        {event.subtitle && <p className="text-heading mt-3">{event.subtitle}</p>}
        <p className="mt-6 font-mono text-small">{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US')} · {event.time}</p>
        <p className="text-body mt-1">{event.venue}{event.district ? ` · ${event.district}` : ''}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div>
        {event.description?.[lang] && <p className="mt-8 text-body text-terminal-subdued whitespace-pre-wrap max-w-prose">{event.description[lang]}</p>}
      </div>
      {event.posterUrl && (
        <Image src={event.posterUrl} alt={`${event.session} ${lang === 'ko' ? '포스터' : 'poster'}`} width={900} height={1200} sizes="(min-width: 768px) 48vw, 100vw" className={styles.poster} />
      )}
    </section>
  );
}
