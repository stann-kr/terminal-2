'use client';
import { useLang } from '@/lib/langContext';
import type { TerminalEvent } from '@/lib/events/types';

export default function EventDetail({ event }: { event: TerminalEvent }) {
  const { lang } = useLang();
  const fields = [
    [lang === 'ko' ? '장소' : 'Venue', event.venue],
    [lang === 'ko' ? '지역' : 'District', event.district],
    [lang === 'ko' ? '위치' : 'Location', event.coords],
    [lang === 'ko' ? '정원' : 'Capacity', event.capacity],
    [lang === 'ko' ? '사운드' : 'Sound', event.sound],
  ].filter(([, value]) => value);
  return <section className="border-t border-terminal-bg-panel-border pt-7" aria-labelledby="event-details-title"><h2 id="event-details-title" className="text-h2 mb-6">{lang === 'ko' ? '이벤트 안내' : 'Event details'}</h2><dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">{fields.map(([label, value]) => <div key={label}><dt className="text-small text-terminal-subdued mb-1">{label}</dt><dd className="text-body break-words">{value}</dd></div>)}</dl></section>;
}
