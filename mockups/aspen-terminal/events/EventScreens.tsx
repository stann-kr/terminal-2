/* eslint-disable @next/next/no-img-element -- Standalone offline preview has no Next image server. */
import { useState } from 'react';
import { getRequestWindowState } from '../../../lib/events/lifecycle';
import { ACCESS_WINDOW_DAYS } from '../../../lib/gate/requestPolicy';
import { Action, EventPicker, EventState, NoEvent, PageHeading } from '../shared/Ui';
import { href, isPublicArtist, scenarioClock, type ScreenProps } from './data';
import { TerminalText } from '../motion/TerminalText';
import { EventCountdown } from './EventCountdown';
import './events.css';

export function Home(props: ScreenProps & { poster: string }) {
  const { event, t, lang, poster } = props;
  const [failedPoster, setFailedPoster] = useState('');
  if (!event) return <NoEvent t={t} />;
  const showPoster = Boolean(poster && poster !== failedPoster);
  const session = event.session.match(/\[([^\]]+)\]/)?.[0] ?? event.id;
  const title = event.session.replace(/\s*\[[^\]]+\]/, '');
  const date = event.date.split('-');
  const introduction = event.description?.[lang].split('\n\n')[0] ?? event.subtitle;
  return <article className="tm-home" data-poster={showPoster}>
    <EventCountdown key={`${event.id}:${props.scenario}`} event={event} scenario={props.scenario} t={t} />
    <div className="tm-home-title tm-cell"><div data-motion-copy className="tm-home-meta"><EventState event={event} t={t} /><span className="tm-eyebrow">{event.id}</span></div><h1 data-motion-title tabIndex={-1}><TerminalText>{title}</TerminalText></h1><p className="tm-eyebrow">SEOUL / TECHNO</p></div>
    <section className="tm-home-date tm-cell" aria-label={t('일시와 장소', 'Date and venue')}><p className="tm-eyebrow">{t('일시 · 장소', 'DATE / VENUE')}</p><div><p data-motion-copy className="tm-home-day">{date[1]}.{date[2]}</p><time data-motion-copy dateTime={`${event.date}T${event.time.slice(0, 5)}:00+09:00`}>{date[0]} · {event.time}</time></div><div><h2 data-motion-copy>{event.venue}</h2><p className="tm-eyebrow">{event.district}</p></div></section>
    <div className="tm-home-action tm-cell"><p className="tm-eyebrow">{event.status === 'ARCHIVED' ? 'ARCHIVE' : 'EVENT DETAILS'}</p><p>{event.status === 'ARCHIVED' ? t('온라인 신청 마감', 'Online requests closed') : event.status === 'LIVE' ? t('이벤트 진행 중', 'Event in progress') : t('일정과 라인업을 확인하세요.', 'Explore the event and lineup.')}</p><Action page="gate" event={event.id}>{event.status === 'ARCHIVED' ? t('아카이브 보기', 'View archive') : t('이벤트 보기', 'View event')}</Action>{event.status === 'ARCHIVED' && <a className="tm-text-link" href={href('signal')}><span>{t('다음 이벤트 소식 받기', 'Get future event updates')}</span></a>}</div>
    <div className="tm-home-serial tm-cell">{showPoster ? <img src={poster} alt={`${event.session} ${t('포스터', 'poster')}`} onError={() => setFailedPoster(poster)} /> : <><span className="tm-eyebrow">SESSION</span><p data-motion-title>{session}</p><span className="tm-eyebrow">{event.subtitle}</span></>}</div>
    <section className="tm-home-intro tm-cell"><p className="tm-eyebrow">{event.subtitle}</p><h2 data-motion-copy>{introduction}</h2></section>
  </article>;
}

export function Gate(props: ScreenProps & { poster: string }) {
  const { event, events, t, lang, scenario } = props;
  const [failedPoster, setFailedPoster] = useState('');
  if (!event) return <NoEvent t={t} invalid={events.length > 0} />;
  const publicArtists = event.artists.filter(isPublicArtist);
  const canRequest = event.status === 'UPCOMING' && getRequestWindowState(event, ACCESS_WINDOW_DAYS, scenarioClock(scenario)).isActive;
  const details = [[t('일시', 'Date'), `${event.date} / ${event.time}`], [t('장소', 'Venue'), event.venue], [t('지역', 'District'), event.district], [t('위치', 'Coordinates'), event.coords], [t('정원', 'Capacity'), event.capacity.includes('CLASSIFIED') ? '' : event.capacity], [t('사운드', 'Sound'), event.sound]].filter(([, value]) => value);
  return <>
    <PageHeading code="GATE / EVENT FILE" title={event.session}><EventPicker {...props} page="gate" /></PageHeading>
    <div className="tm-gate-grid">
      <section className="tm-gate-copy tm-cell"><div className="tm-gate-meta"><EventState event={event} t={t} /><span>{event.id}</span></div><h2 data-motion-title><TerminalText>{event.subtitle}</TerminalText></h2><div className="tm-prose">{event.description?.[lang].split('\n\n').map((text, i) => <p data-motion-copy key={i}>{text}</p>)}</div>{props.poster && props.poster !== failedPoster && <img className="tm-gate-poster" src={props.poster} alt={`${event.session} ${t('포스터', 'poster')}`} onError={() => setFailedPoster(props.poster)} />}</section>
      <section className="tm-gate-details tm-cell"><h2 className="tm-eyebrow">{t('이벤트 정보', 'EVENT INFO')}</h2><dl>{details.map(([label, value]) => <div data-motion-copy key={label}><dt>{label}</dt><dd>{value.includes(", ") || value.includes(" / ") ? value.split(/(, | \/ )/).map((part, index) => index % 2 ? part : <span className="tm-data-part" key={index}>{part}</span>) : value}</dd></div>)}</dl></section>
      <section className="tm-gate-lineup tm-cell"><h2 className="tm-eyebrow">LINEUP</h2><ul>{publicArtists.map(artist => <li key={artist.id}><a href={href('lineup', event.id, artist.id)}><span>{artist.name}</span></a><p data-motion-copy>{artist.time === 'TBA' ? t('시간 미공개', 'Set time not announced') : artist.time}</p></li>)}</ul>{event.artists.length > publicArtists.length && <p className="tm-gate-note">{t(`그 외 ${event.artists.length - publicArtists.length}개 항목은 아티스트 정보 미공개`, `${event.artists.length - publicArtists.length} other artist records are unpublished`)}</p>}<div className="tm-gate-next">{canRequest ? <Action page="request" event={event.id}>{t('게스트 신청', 'Guest request')}</Action> : <p>{event.status === 'ARCHIVED' || event.status === 'LIVE' ? t('이 이벤트의 온라인 신청은 마감되었습니다.', 'Online requests for this event are closed.') : t('현재 온라인 신청 기간이 아닙니다.', 'Online requests are not open.')}</p>}<Action page="lineup" event={event.id} secondary>{t('라인업 보기', 'Explore lineup')}</Action></div></section>
    </div>
  </>;
}
