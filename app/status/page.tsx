'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import ReturnLink from '@/components/ui/ReturnLink';
import TerminalButton from '@/components/TerminalButton';
import StatusMetric from './StatusMetric';
import NodeMap from './NodeMap';
import { useLang, useT } from '@/lib/langContext';
import { fetchEvents, eventKeys } from '@/lib/events/client';
import { formatEventDate, getArchivedOrElapsedEvents, getFutureUpcomingEvent, getEffectiveEventStatus } from '@/lib/events/lifecycle';
import { useEventClock } from '@/lib/events/useEventClock';

export default function StatusPage() {
  const t = useT();
  const { lang } = useLang();
  const { data: events = [], isLoading, isError, refetch } = useQuery({ queryKey: eventKeys.list(), queryFn: fetchEvents });
  const now = useEventClock(events);
  const archived = getArchivedOrElapsedEvents(events, now);
  const nextEvent = getFutureUpcomingEvent(events, now);
  const artists = new Set(archived.flatMap(e => e.artists).map(a => a.name)).size;
  const statusLabel = (status: string) => lang === 'ko' ? ({ LIVE: '진행 중', UPCOMING: '예정', ARCHIVED: '지난 이벤트' }[status] ?? status) : ({ LIVE: 'Live', UPCOMING: 'Upcoming', ARCHIVED: 'Past event' }[status] ?? status);
  return <PageLayout>
    <ReturnLink />
    <PageHeader path="/terminal/status" title={lang === 'ko' ? '이벤트 기록' : 'Event history'} />
    {isLoading ? <p role="status" className="py-8">{t.status.loading}</p> : isError ? <div role="alert" className="py-8 space-y-4"><p>{t.common.signalUnstable}</p><p>{t.common.dbUnreachable}</p><TerminalButton onClick={() => void refetch()}>{t.common.retry}</TerminalButton></div> : <>
      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        <StatusMetric label={t.status.labelSessionsRun} value={String(archived.length)} unit={lang === 'ko' ? '이벤트' : 'Events'} />
        <StatusMetric label={t.status.labelNextLaunch} value={nextEvent?.session ?? '—'} unit={nextEvent ? formatEventDate(nextEvent, lang === 'ko' ? 'ko-KR' : 'en-US') : (lang === 'ko' ? '예정 없음' : 'None scheduled')} />
        <StatusMetric label={t.status.labelArtistNodes} value={String(artists)} unit={lang === 'ko' ? '지난 이벤트 기준' : 'Across past events'} />
      </div>
      {events.length === 0 ? <p role="status">{t.status.noSessions}</p> : <ul aria-label={t.status.sessionLogTitle} className="border-t border-terminal-bg-panel-border">{[...events].sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).map(event => <li key={event.id} className="py-6 border-b border-terminal-bg-panel-border"><Link href={`/gate?event=${encodeURIComponent(event.id)}`} className="text-h2 underline underline-offset-4">{event.session}</Link><p className="mt-2 text-small text-terminal-subdued">{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US')} · {event.venue}</p><p className="mt-2 text-small">{statusLabel(getEffectiveEventStatus(event, now))} · {t.lineup.actCount(event.artists.length)}</p></li>)}</ul>}
    </>}
    <details className="mt-12 text-small text-terminal-subdued"><summary className="cursor-pointer min-h-11 py-3">{lang === 'ko' ? 'TERMINAL 세계관 지도' : 'TERMINAL universe map'}</summary><p className="mb-4">{lang === 'ko' ? '브랜드를 표현한 정적 지도입니다.' : 'A static map of the TERMINAL universe.'}</p><NodeMap /></details>
  </PageLayout>;
}
