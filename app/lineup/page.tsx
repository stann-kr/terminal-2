'use client';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/shell/PageLayout';
import ReturnLink from '@/components/ui/ReturnLink';
import PageHeader from '@/components/ui/PageHeader';
import TerminalButton from '@/components/TerminalButton';
import TerminalActionLink from '@/components/TerminalActionLink';
import ArtistRow from './ArtistRow';
import { useLang, useT } from '@/lib/langContext';
import { fetchEvents, eventKeys } from '@/lib/events/client';
import { formatEventDate, selectEvent } from '@/lib/events/lifecycle';
import { useEventClock } from '@/lib/events/useEventClock';
import { useUrlQueryState } from '@/lib/useUrlQueryState';

export default function LineupPage() {
  const t = useT();
  const { lang } = useLang();
  const [selectedId, setSelectedId] = useUrlQueryState('event');
  const { data: events = [], isLoading, isError, refetch } = useQuery({
    queryKey: eventKeys.list(),
    queryFn: fetchEvents,
  });
  const now = useEventClock(events);
  const selectedEvent = selectEvent(events, selectedId, now);

  return (
    <PageLayout width="event">
      <ReturnLink />
      <PageHeader path="/terminal/lineup" title={lang === 'ko' ? '라인업' : 'Lineup'} />

      {isLoading ? (
        <p role="status" className="py-8">{t.lineup.loading}</p>
      ) : isError ? (
        <div role="alert" className="py-8 space-y-4">
          <p>{t.common.signalUnstable}</p>
          <p className="text-terminal-subdued">{t.common.dbUnreachable}</p>
          <TerminalButton variant="ghost" onClick={() => void refetch()}>{t.common.retry}</TerminalButton>
        </div>
      ) : !selectedEvent ? (
        <p role="status" className="py-8">{lang === 'ko' ? '등록된 이벤트가 없습니다.' : 'No events have been published.'}</p>
      ) : (
        <>
          {events.length > 1 && (
            <div className="mb-8">
              <label htmlFor="lineup-event" className="block text-small mb-2">{lang === 'ko' ? '이벤트 선택' : 'Select event'}</label>
              <select
                id="lineup-event"
                value={selectedEvent.id}
                onChange={(event) => setSelectedId(event.target.value)}
                className="w-full min-h-11 p-3 bg-terminal-bg-panel border border-terminal-bg-panel-border text-body"
              >
                {events.map((event) => <option key={event.id} value={event.id}>{event.session} · {event.date}</option>)}
              </select>
            </div>
          )}

          <section key={selectedEvent.id} aria-labelledby="lineup-event-title">
            <div className="pb-8 border-b border-terminal-bg-panel-border">
              <p className="text-small text-terminal-subdued mb-3">
                {lang === 'ko'
                  ? { LIVE: '진행 중', UPCOMING: '예정된 이벤트', ARCHIVED: '지난 이벤트' }[selectedEvent.status]
                  : { LIVE: 'Live now', UPCOMING: 'Upcoming event', ARCHIVED: 'Past event' }[selectedEvent.status]}
              </p>
              <h2 id="lineup-event-title" className="text-h1 md:text-title font-semibold break-words">{selectedEvent.session}</h2>
              <p className="mt-4 font-mono text-small">{formatEventDate(selectedEvent, lang === 'ko' ? 'ko-KR' : 'en-US')} · {selectedEvent.time.replace(/ KST$/, '')} KST</p>
              <p className="mt-2">{selectedEvent.venue}{selectedEvent.district ? ` · ${selectedEvent.district}` : ''}</p>
              <div className="mt-5">
                <TerminalActionLink variant="ghost" href={`/gate?event=${encodeURIComponent(selectedEvent.id)}`}>{lang === 'ko' ? '이벤트 보기' : 'View event'}</TerminalActionLink>
              </div>
            </div>

            {selectedEvent.artists.length > 0 ? (
              <ul aria-label={t.lineup.colArtist}>
                {selectedEvent.artists.map((artist, index) => <li key={artist.id}><ArtistRow artist={artist} index={index} /></li>)}
              </ul>
            ) : <p role="status" className="py-8">{lang === 'ko' ? '아직 공개된 아티스트가 없습니다.' : 'The lineup has not been announced yet.'}</p>}

            <p className="mt-6 text-small text-terminal-subdued">
              {selectedEvent.status === 'ARCHIVED' ? t.lineup.footerArchived : t.lineup.footerUpcoming}
            </p>
          </section>
        </>
      )}
    </PageLayout>
  );
}
