'use client';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/shell/PageLayout';
import styles from './GatePage.module.css';
import TerminalButton from '@/components/TerminalButton';
import TerminalActionLink from '@/components/TerminalActionLink';
import EventSummary from '@/components/events/EventSummary';
import EventDetail from './EventDetail';
import { useLang, useT } from '@/lib/langContext';
import { fetchEvents, eventKeys } from '@/lib/events/client';
import { getArchivedOrElapsedEvents, getDefaultEvent, getEffectiveEventStatus, getEventDateTime, getFutureUpcomingEvent, getRequestWindowState, selectEvent } from '@/lib/events/lifecycle';
import { useEventClock } from '@/lib/events/useEventClock';
import { ACCESS_WINDOW_DAYS } from '@/lib/gate/requestPolicy';
import { useUrlQueryState } from '@/lib/useUrlQueryState';

export default function GatePage() {
  const t = useT();
  const { lang } = useLang();
  const [view, setView] = useUrlQueryState('view');
  const [selectedId, setSelectedId] = useUrlQueryState('event');
  const { data: events = [], isLoading, isError, refetch } = useQuery({ queryKey: eventKeys.list(), queryFn: fetchEvents });
  const now = useEventClock(events, ACCESS_WINDOW_DAYS);
  const requested = events.find(e => e.id === selectedId);
  const defaultEvent = getDefaultEvent(events, now);
  const isArchive = requested ? getEffectiveEventStatus(requested, now) === 'ARCHIVED' : view === 'archive' || (!view && defaultEvent?.status === 'ARCHIVED');
  const candidates = isArchive ? getArchivedOrElapsedEvents(events, now) : events.filter(e => getEffectiveEventStatus(e, now) !== 'ARCHIVED');
  const event = selectEvent(candidates, selectedId, now);
  const requestEvent = getFutureUpcomingEvent(events, now);
  const requestWindow = event ? getRequestWindowState(event, ACCESS_WINDOW_DAYS, now) : null;
  const canRequest = event?.id === requestEvent?.id && requestWindow?.isActive;
  const switchView = (archive: boolean) => setView(archive ? 'archive' : 'upcoming', { event: '' });
  return (
    <PageLayout width="event" flush>
      <div className={styles.toolbar}>
      <div role="group" aria-label={lang === 'ko' ? '이벤트 보기' : 'Event view'} className={styles.tabs}>
        <button type="button" className={styles.tab} aria-pressed={!isArchive} onClick={() => { if (isArchive) switchView(false); }}>{t.gate.tabUpcoming}</button>
        <button type="button" className={styles.tab} aria-pressed={isArchive} onClick={() => { if (!isArchive) switchView(true); }}>{t.gate.tabArchive}</button>
      </div>
      {!isLoading && !isError && candidates.length > 1 && <div className={styles.selector}><label htmlFor="gate-event">{lang === 'ko' ? '이벤트 선택' : 'Select event'}</label><select id="gate-event" value={event?.id ?? ''} onChange={e => setSelectedId(e.target.value)}>{candidates.map(e => <option key={e.id} value={e.id}>{e.session} · {e.date}</option>)}</select></div>}
      </div>
      {isLoading ? <div role="status" className={styles.state}><h1>{lang === 'ko' ? '이벤트' : 'Events'}</h1>{t.gate.loading}</div> : isError ? <div role="alert" className={styles.state}><h1>{t.common.signalUnstable}</h1><p>{t.common.dbUnreachable}</p><TerminalButton onClick={() => void refetch()}>{t.common.retry}</TerminalButton></div> : <>
        {event ? <>
          <EventSummary key={event.id} event={event} details={<EventDetail event={event} />}>
            {canRequest && <TerminalActionLink href={`/gate/request?event=${encodeURIComponent(event.id)}`}>{t.gate.requestBtn}</TerminalActionLink>}
            <TerminalActionLink variant="ghost" href={`/lineup?event=${encodeURIComponent(event.id)}`}>{lang === 'ko' ? '라인업 보기' : 'View lineup'}</TerminalActionLink>
            {!canRequest && <p className="w-full text-small text-terminal-subdued" role="status">{event.status === 'LIVE' ? (lang === 'ko' ? '이벤트가 진행 중입니다. 온라인 신청은 마감되었습니다.' : 'The event is live. Online requests are closed.') : event.status === 'ARCHIVED' ? t.request.eventElapsed : requestWindow?.opensInDays ? (lang === 'ko' ? '신청 시작: ' : 'Requests open: ') + new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(getEventDateTime(event).getTime() - ACCESS_WINDOW_DAYS * 86400000)) + ' KST' : (lang === 'ko' ? '현재 이 이벤트는 온라인 신청을 받지 않습니다.' : 'Online requests are not available for this event.')}</p>}
          </EventSummary>
        </> : <div role="status" className={styles.state}><h1>{lang === 'ko' ? '이벤트' : 'Events'}</h1>{isArchive ? t.gate.noArchive : t.request.noEvent}</div>}
      </>}
    </PageLayout>
  );
}
