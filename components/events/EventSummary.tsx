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
        <p className={styles.status}><span aria-hidden="true">[{event.status}]</span> {status}</p>
        <h1 id="event-title" className={styles.title}>{event.session}</h1>
        {event.subtitle && <p className={styles.subtitle}>{event.subtitle}</p>}
        <dl className={styles.metadata}>
          <div>
            <dt>{lang === 'ko' ? '일시' : 'Date'}</dt>
            <dd><time dateTime={event.date}>{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US')}</time><span className={styles.time}>{event.time.replace(/ KST$/, '')} KST</span></dd>
          </div>
          <div>
            <dt>{lang === 'ko' ? '장소' : 'Venue'}</dt>
            <dd>{event.venue}{event.district && <span className={styles.district}> / {event.district}</span>}</dd>
          </div>
        </dl>
        <div className={styles.actions}>{children}</div>
        {event.description?.[lang] && <p className={styles.description}>{event.description[lang]}</p>}
      </div>
      {event.posterUrl && (
        <Image src={event.posterUrl} alt={`${event.session} ${lang === 'ko' ? '포스터' : 'poster'}`} width={900} height={1200} sizes="(min-width: 1184px) 540px, (min-width: 768px) 46vw, calc(100vw - 40px)" className={styles.poster} />
      )}
    </section>
  );
}
