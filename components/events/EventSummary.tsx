'use client';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { TerminalEvent } from '@/lib/events/types';
import { formatEventDate } from '@/lib/events/lifecycle';
import { useLang } from '@/lib/langContext';
import styles from './EventSummary.module.css';
import { useEventSummaryMotion } from './useEventSummaryMotion';

export default function EventSummary({ event, children }: { event: TerminalEvent; children?: ReactNode }) {
  const { lang } = useLang();
  const rootRef = useEventSummaryMotion(event.id, event.posterUrl);
  const status = lang === 'ko'
    ? { LIVE: '진행 중', UPCOMING: '예정된 이벤트', ARCHIVED: '지난 이벤트' }[event.status]
    : { LIVE: 'Live now', UPCOMING: 'Upcoming event', ARCHIVED: 'Past event' }[event.status];
  return (
    <section ref={rootRef} className={`${styles.summary} ${event.posterUrl ? styles.withPoster : ''}`} aria-labelledby="event-title">
      <div className={styles.information}>
        <p data-event="status" className={styles.status}><span aria-hidden="true">[{event.status}]</span> {status}</p>
        <h1 data-event="title" id="event-title" className={styles.title}>{event.session}</h1>
        {event.subtitle && <p className={styles.subtitle}>{event.subtitle}</p>}
        <dl data-event="metadata" className={styles.metadata}>
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
        {event.description?.[lang] && <p data-event="description" className={styles.description}>{event.description[lang]}</p>}
      </div>
      {event.posterUrl && (
        <div data-event="poster" className={styles.posterFrame}>
          <div data-event="surface" className={styles.posterSurface}>
            <Image src={event.posterUrl} alt={`${event.session} ${lang === 'ko' ? '포스터' : 'poster'}`} width={900} height={1200} sizes="(min-width: 1184px) 540px, (min-width: 768px) 46vw, calc(100vw - 40px)" className={styles.poster} />
            <span aria-hidden="true" className={styles.scanWindow}><span data-event="scan" className={styles.scan} /></span>
          </div>
          <span aria-hidden="true" data-event="progress" className={styles.progress} />
        </div>
      )}
    </section>
  );
}
