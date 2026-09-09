'use client';
import { useLang } from '@/lib/langContext';
import type { TerminalEvent } from '@/lib/events/types';
import styles from './EventDetail.module.css';

export default function EventDetail({ event }: { event: TerminalEvent }) {
  const { lang } = useLang();
  const fields = [
    [lang === 'ko' ? '위치' : 'Location', event.coords],
    [lang === 'ko' ? '정원' : 'Capacity', event.capacity],
    [lang === 'ko' ? '사운드' : 'Sound', event.sound],
  ].filter(([, value]) => value);
  if (!fields.length) return null;
  return <section className={styles.details} aria-labelledby="event-details-title">
    <h2 id="event-details-title">{lang === 'ko' ? '이벤트 안내' : 'Event details'}</h2>
    <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </section>;
}
