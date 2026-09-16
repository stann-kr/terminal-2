import { useRef, type MouseEvent } from 'react';
import { biography, href, isPublicArtist, type ScreenProps } from '../events/data';
import { EventPicker, NoEvent, PageHeading } from '../shared/Ui';
import './lineup.css';

export function Lineup(props: ScreenProps & { artistId: string | null }) {
  const { event, events, artistId, t, lang } = props;
  const headingRef = useRef<HTMLHeadingElement>(null);
  if (!event) return <NoEvent t={t} invalid={events.length > 0} />;
  const publicArtists = event.artists.filter(isPublicArtist);
  const requested = event.artists.find(artist => artist.id === artistId);
  const selected = artistId ? (requested && isPublicArtist(requested) ? requested : undefined) : publicArtists[0];
  const choose = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    requestAnimationFrame(() => headingRef.current?.focus());
  };
  const returnToRoster = () => document.getElementById(`tm-artist-${selected?.id ?? publicArtists[0]?.id}`)?.focus();
  return <>
    <PageHeading code="LINEUP / ARTIST DIRECTORY" title={t('라인업', 'Lineup')}><EventPicker {...props} page="lineup" /></PageHeading>
    <div className="tm-lineup" data-has-profile={Boolean(selected)}>
      <aside className="tm-roster"><div className="tm-cell"><p className="tm-eyebrow">{event.session}</p><p className="tm-roster-date">{event.date} / {event.venue}</p><h2 className="tm-eyebrow">{t('공개된 아티스트', 'PUBLISHED ARTISTS')}</h2></div><ul>{publicArtists.map((artist, index) => <li key={artist.id}><a id={`tm-artist-${artist.id}`} href={href('lineup', event.id, artist.id)} aria-current={selected?.id === artist.id ? 'true' : undefined} aria-controls="tm-artist-profile" onClick={choose}><span className="tm-artist-index">{String(index + 1).padStart(2, '0')}</span><span>{artist.name}</span></a></li>)}</ul>{event.artists.length > publicArtists.length && <p className="tm-roster-unpublished">{t(`그 외 ${event.artists.length - publicArtists.length}개 항목은 아티스트 정보가 공개되지 않았습니다.`, `${event.artists.length - publicArtists.length} other artist records have not been published.`)}</p>}<a className="tm-roster-event tm-text-link" href={href('gate', event.id)}>{t('이벤트 정보', 'Event details')}</a></aside>
      <section id="tm-artist-profile" className="tm-artist-profile tm-cell" onKeyDown={e => { if (e.key === 'Escape') returnToRoster(); }} aria-labelledby="tm-artist-name">
        {selected ? <><div className="tm-profile-top"><p className="tm-eyebrow">ARTIST / {selected.id}</p><button type="button" className="tm-button tm-roster-return" onClick={returnToRoster}>{t('명단으로', 'Back to list')}</button></div><h2 id="tm-artist-name" ref={headingRef} tabIndex={-1}>{selected.name}</h2><dl className="tm-artist-data"><div><dt>{t('출신', 'Origin')}</dt><dd>{selected.origin}</dd></div><div><dt>{t('스테이지', 'Stage')}</dt><dd>{selected.dock}</dd></div><div><dt>{t('출연 시간', 'Set time')}</dt><dd>{selected.time === 'TBA' ? t('미공개', 'Not announced') : selected.time}</dd></div></dl><div className="tm-artist-bio tm-prose">{biography(selected, lang).map((line, i) => <p key={i}>{line}</p>)}</div></> : <><h2 id="tm-artist-name" tabIndex={-1} ref={headingRef}>{artistId ? t(requested ? '아티스트 정보 미공개' : '아티스트를 찾을 수 없습니다.', requested ? 'Artist not published' : 'Artist not found.') : t('공개된 아티스트가 없습니다.', 'No published artists.')}</h2><p role="status">{t('공개 명단에서 아티스트를 선택해 주세요.', 'Choose an artist from the published roster.')}</p></>}
      </section>
    </div>
  </>;
}
