'use client';
import { useEffect, useId, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import TerminalButton from '@/components/TerminalButton';
import TerminalActionLink from '@/components/TerminalActionLink';
import ArtistRow, { getArtistTriggerId } from './ArtistRow';
import ArtistProfile from './ArtistProfile';
import { useLang, useT } from '@/lib/langContext';
import { fetchEvents, eventKeys } from '@/lib/events/client';
import { formatEventDate, selectEvent } from '@/lib/events/lifecycle';
import { useEventClock } from '@/lib/events/useEventClock';
import { useUrlQueryState } from '@/lib/useUrlQueryState';
import styles from './LineupPage.module.css';

export default function LineupPage() {
  const t = useT();
  const { lang } = useLang();
  const [selectedId, setSelectedId] = useUrlQueryState('event');
  const [artistId, setArtistId] = useUrlQueryState('artist');
  const { data: events = [], isLoading, isError, refetch } = useQuery({ queryKey: eventKeys.list(), queryFn: fetchEvents });
  const now = useEventClock(events);
  const selectedEvent = selectEvent(events, selectedId, now);
  const selectedArtist = selectedEvent?.artists.find(artist => artist.id === artistId);
  const profileId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusProfile = useRef(false);
  const focusRoster = useRef<string | null>(null);

  useEffect(() => {
    if (focusProfile.current && selectedArtist) headingRef.current?.focus();
    if (focusRoster.current && !selectedArtist) document.getElementById(getArtistTriggerId(focusRoster.current))?.focus();
    focusProfile.current = false;
    focusRoster.current = null;
  }, [selectedArtist]);

  const selectArtist = (id: string) => {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (artistId === id) { if (isMobile) headingRef.current?.focus(); return; }
    focusProfile.current = isMobile;
    setArtistId(id, { event: selectedEvent!.id });
  };
  const returnToRoster = () => {
    focusRoster.current = selectedArtist?.id ?? null;
    setArtistId('');
  };

  return <PageLayout width="event" flush>
    <PageHeader path="/lineup" title={lang === 'ko' ? '라인업' : 'Lineup'} />
    {isLoading ? <p role="status" className={styles.state}>{t.lineup.loading}</p>
      : isError ? <div role="alert" className={styles.state}><p>{t.common.signalUnstable}</p><p>{t.common.dbUnreachable}</p><TerminalButton variant="ghost" onClick={() => void refetch()}>{t.common.retry}</TerminalButton></div>
      : !selectedEvent ? <p role="status" className={styles.state}>{lang === 'ko' ? '등록된 이벤트가 없습니다.' : 'No events have been published.'}</p>
      : <>
        <div className={styles.eventHeader}>
          <div><p className={styles.eventStatus}>{lang === 'ko' ? { LIVE: '진행 중', UPCOMING: '예정된 이벤트', ARCHIVED: '지난 이벤트' }[selectedEvent.status] : { LIVE: 'Live now', UPCOMING: 'Upcoming event', ARCHIVED: 'Past event' }[selectedEvent.status]}</p><h2>{selectedEvent.session}</h2><p>{formatEventDate(selectedEvent, lang === 'ko' ? 'ko-KR' : 'en-US')} · {selectedEvent.time}</p><p>{selectedEvent.venue}</p></div>
          <div className={styles.eventActions}>
            {events.length > 1 && <div><label htmlFor="lineup-event">{lang === 'ko' ? '이벤트 선택' : 'Select event'}</label><select id="lineup-event" value={selectedEvent.id} onChange={e => setSelectedId(e.target.value, { artist: '' })}>{events.map(event => <option key={event.id} value={event.id}>{event.session} · {event.date}</option>)}</select></div>}
            <TerminalActionLink variant="ghost" href={`/gate?event=${encodeURIComponent(selectedEvent.id)}`}>{lang === 'ko' ? '이벤트 보기' : 'View event'}</TerminalActionLink>
          </div>
        </div>
        <div className={styles.workspace} data-has-profile={Boolean(selectedArtist)}>
          <div className={styles.roster}>
            <p className={styles.rosterHeader}><span>{lang === 'ko' ? '이름을 선택하면 소개를 볼 수 있습니다.' : 'Select a name to read their biography.'}</span><span>{t.lineup.actCount(selectedEvent.artists.length)}</span></p>
            {artistId && !selectedArtist && <p role="status" className={styles.state}>{lang === 'ko' ? '선택한 아티스트를 이 행사에서 찾을 수 없습니다. 명단에서 다시 선택해 주세요.' : 'This artist is not in this event. Choose from the roster.'}</p>}
            {selectedEvent.artists.length ? <ul aria-label={t.lineup.colArtist}>{selectedEvent.artists.map((artist, index) => <li key={artist.id}><ArtistRow artist={artist} index={index} selected={selectedArtist?.id === artist.id} profileId={profileId} onSelect={() => selectArtist(artist.id)} /></li>)}</ul>
              : <p role="status" className={styles.state}>{lang === 'ko' ? '아직 공개된 아티스트가 없습니다.' : 'The lineup has not been announced yet.'}</p>}
            <p className={styles.rosterNote}>{selectedEvent.status === 'ARCHIVED' ? t.lineup.footerArchived : t.lineup.footerUpcoming}</p>
          </div>
          <div id={profileId} className={styles.profileRegion} hidden={!selectedArtist}>
            {selectedArtist && <ArtistProfile key={selectedArtist.id} artist={selectedArtist} headingRef={headingRef} onReturn={returnToRoster} />}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{selectedArtist ? (lang === 'ko' ? '선택한 아티스트: ' : 'Selected artist: ') + selectedArtist.name : ''}</p>
      </>}
  </PageLayout>;
}
