'use client';
import Image from 'next/image';
import { useId, useState, type ReactNode } from 'react';
import type { TerminalEvent } from '@/lib/events/types';
import { formatEventDate } from '@/lib/events/lifecycle';
import { useLang } from '@/lib/langContext';
import styles from './EventSummary.module.css';
import { useEventSummaryMotion } from './useEventSummaryMotion';

export default function EventSummary({ event, children, details }: { event: TerminalEvent; children?: ReactNode; details?: ReactNode }) {
  const { lang } = useLang();
  const titleId = useId();
  const [failedPoster, setFailedPoster] = useState<string>();
  const hasPoster = Boolean(event.posterUrl && failedPoster !== event.posterUrl);
  const rootRef = useEventSummaryMotion(event.id, hasPoster ? event.posterUrl : undefined);
  const status = lang === 'ko'
    ? { LIVE: '진행 중', UPCOMING: '예정된 이벤트', ARCHIVED: '지난 이벤트' }[event.status]
    : { LIVE: 'Live now', UPCOMING: 'Upcoming event', ARCHIVED: 'Past event' }[event.status];
  const description = event.description?.[lang];
  return <section ref={rootRef} className={styles.summary} aria-labelledby={titleId}>
    <div className={styles.information}>
      <div data-event="readout" className={styles.infoBody}>
        <p data-event="status" className={styles.status}><span aria-hidden="true" />{status}</p>
        <h1 data-event="title" id={titleId} className={styles.title}>{event.session}</h1>
        {event.subtitle && <p className={styles.subtitle}>{event.subtitle}</p>}
        <dl data-event="metadata" className={styles.metadata}>
          <div><dt>{lang === 'ko' ? '일시' : 'Date'}</dt><dd><time dateTime={event.date}>{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US')}</time><span className={styles.time}>{event.time.replace(/ KST$/, '')} KST</span></dd></div>
          <div><dt>{lang === 'ko' ? '장소' : 'Venue'}</dt><dd>{event.venue}{event.district && <span className={styles.district}> / {event.district}</span>}</dd></div>
        </dl>
        <div className={styles.actions}>{children}</div>
        {description && <p data-event="description" className={styles.description}>{description}</p>}
        {details}
      </div>
    </div>
    <div className={styles.visual}>
      <div data-event="poster" className={styles.posterFrame}>
        <div data-event="surface" className={styles.posterSurface}>
          {hasPoster ? <Image src={event.posterUrl!} alt={`${event.session} ${lang === 'ko' ? '포스터' : 'poster'}`} width={900} height={1200} sizes="(min-width: 1024px) 512px, calc(100vw - 32px)" className={styles.poster} onError={() => setFailedPoster(event.posterUrl)} />
            : <div className={styles.posterFallback}>
              <span aria-hidden="true" className={styles.fallbackLabel}>TERMINAL // {event.date}</span>
              <span aria-hidden="true" className={styles.fallbackTitle}>{event.session}</span>
              <p>{lang === 'ko' ? '공개된 포스터가 없습니다.' : 'No poster is available.'}</p>
            </div>}
        </div>
        <span aria-hidden="true" data-event="progress" className={styles.progress} />
      </div>
    </div>
  </section>;
}
