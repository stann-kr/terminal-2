'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import TerminalButton from '@/components/TerminalButton';
import { useLang, useT } from '@/lib/langContext';
import { fetchEvents, eventKeys } from '@/lib/events/client';
import { formatEventDate, getArchivedOrElapsedEvents, getEffectiveEventStatus } from '@/lib/events/lifecycle';
import { useEventClock } from '@/lib/events/useEventClock';
import styles from './StatusPage.module.css';

export default function StatusPage() {
  const t = useT();
  const { lang } = useLang();
  const { data: events = [], isLoading, isError, refetch } = useQuery({ queryKey: eventKeys.list(), queryFn: fetchEvents });
  const now = useEventClock(events);
  const archived = getArchivedOrElapsedEvents(events, now);
  const artists = new Set(archived.flatMap(e => e.artists).map(a => a.name)).size;
  const statusLabel = (status: string) => lang === 'ko' ? ({ LIVE: '진행 중', UPCOMING: '예정', ARCHIVED: '지난 이벤트' }[status] ?? status) : ({ LIVE: 'Live', UPCOMING: 'Upcoming', ARCHIVED: 'Past event' }[status] ?? status);
  return <PageLayout width="event" flush>
    <PageHeader path="/status" title={lang === 'ko' ? '이벤트 기록' : 'Event history'} />
    {isLoading ? <p role="status" className={styles.state}>{t.status.loading}</p>
      : isError ? <div role="alert" className={styles.state}><p>{t.common.signalUnstable}</p><p>{t.common.dbUnreachable}</p><TerminalButton onClick={() => void refetch()}>{t.common.retry}</TerminalButton></div>
      : <>
        <dl className={styles.summary}>
          <div><dt>{t.status.labelSessionsRun}</dt><dd>{archived.length}</dd></div>
          <div><dt>{t.status.labelArtistNodes}</dt><dd>{artists}</dd></div>
        </dl>
        {events.length === 0 ? <p role="status" className={styles.state}>{t.status.noSessions}</p>
          : <ul aria-label={t.status.sessionLogTitle} className={styles.ledger}>{[...events].sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).map(event => <li key={event.id}>
            <Link href={`/gate?event=${encodeURIComponent(event.id)}`} className={styles.record}>
              <time dateTime={event.date} className={styles.date}><span>{event.date.slice(0, 4)}</span>{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US', { month: '2-digit', day: '2-digit' })}</time>
              <div className={styles.recordBody}><h2>{event.session}</h2><p>{event.venue}</p><p className={styles.recordMeta}>{statusLabel(getEffectiveEventStatus(event, now))} · {t.lineup.actCount(event.artists.length)}</p></div>
              <span aria-hidden="true" className={styles.arrow}>→</span>
            </Link>
          </li>)}</ul>}
      </>}
  </PageLayout>;
}
