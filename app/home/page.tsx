'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/shell/PageLayout';
import HomeMasthead from './HomeMasthead';
import TerminalButton from '@/components/TerminalButton';
import TerminalActionLink from '@/components/TerminalActionLink';
import EventSummary from '@/components/events/EventSummary';
import DirectoryLink from '@/components/DirectoryLink';
import { useLang, useT } from '@/lib/langContext';
import { fetchEvents, eventKeys } from '@/lib/events/client';
import { getDefaultEvent, getLiveEvents } from '@/lib/events/lifecycle';
import { useEventClock } from '@/lib/events/useEventClock';
import styles from './HomePage.module.css';

export default function HomePage() {
  const t = useT();
  const { lang } = useLang();
  const { data: events = [], isLoading, isError, refetch } = useQuery({ queryKey: eventKeys.list(), queryFn: fetchEvents });
  const now = useEventClock(events);
  const event = getDefaultEvent(events, now);
  const liveEvents = getLiveEvents(events, now);
  const links = [
    { href: '/status', label: lang === 'ko' ? '지난 기록' : 'Event history', description: t.dirDesc.status },
    { href: '/signal', label: lang === 'ko' ? '소식 신청' : 'Event updates', description: t.dirDesc.signal },
    { href: '/link', label: lang === 'ko' ? '공식 채널' : 'Official channels', description: t.dirDesc.link },
  ];
  return (
    <PageLayout width="event" flush>
      <HomeMasthead event={!isLoading && !isError ? event : null} />
      {isLoading ? <div role="status" className={styles.state}><h1>{lang === 'ko' ? '이벤트' : 'Events'}</h1>{t.home.loading}</div>
        : isError ? <div role="alert" className={styles.state}><h1>{t.common.signalUnstable}</h1><p>{t.common.dbUnreachable}</p><TerminalButton onClick={() => void refetch()}>{t.common.retry}</TerminalButton></div>
        : event ? <EventSummary key={event.id} event={event}>
          <TerminalActionLink href={`/gate?${event.status === 'ARCHIVED' ? 'view=archive&' : ''}event=${encodeURIComponent(event.id)}`}>{event.status === 'ARCHIVED' ? t.home.viewArchive : t.home.viewEvent}</TerminalActionLink>
          <TerminalActionLink variant="ghost" href={`/lineup?event=${encodeURIComponent(event.id)}`}>{lang === 'ko' ? '라인업' : 'Lineup'}</TerminalActionLink>
        </EventSummary>
        : <div role="status" className={styles.state}><h1>{lang === 'ko' ? '이벤트' : 'Events'}</h1><p>{t.home.noEvents}</p></div>}
      {liveEvents.length > 1 && <nav className={styles.liveEvents} aria-label={lang === 'ko' ? '진행 중인 다른 이벤트' : 'Other live events'}><h2>{lang === 'ko' ? '진행 중인 다른 이벤트' : 'Other live events'}</h2>{liveEvents.filter(e => e.id !== event?.id).map(e => <Link key={e.id} href={`/gate?event=${encodeURIComponent(e.id)}`}>{e.session}<span aria-hidden="true">↗</span></Link>)}</nav>}
      <nav className={styles.directory} aria-label={lang === 'ko' ? '더 알아보기' : 'Explore'}>
        {links.map((link, index) => <DirectoryLink key={link.href} {...link} index={index + 1} />)}
      </nav>
      <Link href="/?experience=terminal" className={styles.experience}><span aria-hidden="true">[&gt;]</span>{lang === 'ko' ? '터미널 체험' : 'Terminal experience'}</Link>
    </PageLayout>
  );
}
