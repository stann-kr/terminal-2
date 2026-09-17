'use client';

import { useMemo } from 'react';
import CountdownBlock from '@/components/events/CountdownBlock';
import { getEventDateTime } from '@/lib/events/lifecycle';
import type { TerminalEvent } from '@/lib/events/types';
import { useLang } from '@/lib/langContext';
import styles from './HomeMasthead.module.css';

export default function HomeMasthead({ event }: { event: TerminalEvent | null }) {
  const { lang } = useLang();
  const date = event?.date;
  const time = event?.time;
  const targetDate = useMemo(() => date && time ? getEventDateTime({ date, time }) : null, [date, time]);
  if (!event || !targetDate || !Number.isFinite(targetDate.getTime())) return null;

  return (
    <section id="home-ambient-anchor" className={styles.masthead} aria-label={`${event.session} ${lang === 'ko' ? '카운트다운' : 'countdown'}`}>
      <time dateTime={targetDate.toISOString()} className="sr-only">{event.date} {event.time}</time>
      <div className={styles.countdown}><CountdownBlock key={targetDate.getTime()} targetDate={targetDate} compact /></div>
    </section>
  );
}
