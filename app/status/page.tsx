'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import TerminalButton from '@/components/TerminalButton';
import StatusMetric from './StatusMetric';
import NodeMap from './NodeMap';
import { useLang, useT } from '@/lib/langContext';
import { fetchEvents, eventKeys } from '@/lib/events/client';
import { formatEventDate, getArchivedOrElapsedEvents, getFutureUpcomingEvent, getEffectiveEventStatus } from '@/lib/events/lifecycle';
import { useEventClock } from '@/lib/events/useEventClock';
import styles from './StatusPage.module.css';

export default function StatusPage() {
  const t = useT();
  const { lang } = useLang();
  const { data: events = [], isLoading, isError, refetch } = useQuery({ queryKey: eventKeys.list(), queryFn: fetchEvents });
  const now = useEventClock(events);
  const archived = getArchivedOrElapsedEvents(events, now);
  const nextEvent = getFutureUpcomingEvent(events, now);
  const artists = new Set(archived.flatMap(e => e.artists).map(a => a.name)).size;
  const statusLabel = (status: string) => lang === 'ko' ? ({ LIVE: '진행 중', UPCOMING: '예정', ARCHIVED: '지난 이벤트' }[status] ?? status) : ({ LIVE: 'Live', UPCOMING: 'Upcoming', ARCHIVED: 'Past event' }[status] ?? status);
  return <PageLayout width="event" flush>
    <PageHeader path="/status" title={lang === 'ko' ? '이벤트 기록' : 'Event history'} />
    {isLoading ? <p role="status" className={styles.state}>{t.status.loading}</p>
      : isError ? <div role="alert" className={styles.state}><p>{t.common.signalUnstable}</p><p>{t.common.dbUnreachable}</p><TerminalButton onClick={() => void refetch()}>{t.common.retry}</TerminalButton></div>
      : <>
        <div className={styles.metrics}>
          <StatusMetric label={t.status.labelSessionsRun} value={String(archived.length)} unit={lang === 'ko' ? '이벤트' : 'Events'} />
          <StatusMetric label={t.status.labelNextLaunch} value={nextEvent?.session ?? '—'} unit={nextEvent ? formatEventDate(nextEvent, lang === 'ko' ? 'ko-KR' : 'en-US') : (lang === 'ko' ? '예정 없음' : 'None scheduled')} />
          <StatusMetric label={t.status.labelArtistNodes} value={String(artists)} unit={lang === 'ko' ? '지난 이벤트 기준' : 'Across past events'} />
        </div>
        {events.length === 0 ? <p role="status" className={styles.state}>{t.status.noSessions}</p>
          : <ul aria-label={t.status.sessionLogTitle} className={styles.ledger}>{[...events].sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).map(event => <li key={event.id}>
            <Link href={`/gate?event=${encodeURIComponent(event.id)}`} className={styles.record}>
              <time dateTime={event.date} className={styles.date}><span>{event.date.slice(0, 4)}</span>{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US', { month: '2-digit', day: '2-digit' })}</time>
              <div className={styles.recordBody}><h2>{event.session}</h2><p>{event.venue}</p><p className={styles.recordMeta}>{statusLabel(getEffectiveEventStatus(event, now))} · {t.lineup.actCount(event.artists.length)}</p></div>
              <span aria-hidden="true" className={styles.arrow}>↗</span>
            </Link>
          </li>)}</ul>}
      </>}
    <details className={styles.map}><summary>{lang === 'ko' ? 'TERMINAL 세계관 지도' : 'TERMINAL universe map'}</summary><p>{lang === 'ko' ? '브랜드를 표현한 정적 지도입니다.' : 'A static map of the TERMINAL universe.'}</p><NodeMap /></details>
  </PageLayout>;
}
