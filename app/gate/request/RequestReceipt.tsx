'use client';
import { useEffect, useRef } from 'react';
import TerminalActionLink from '@/components/TerminalActionLink';
import { useLang, useT } from '@/lib/langContext';
import { formatEventDate } from '@/lib/events/lifecycle';
import type { TerminalEvent } from '@/lib/events/types';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './RequestPage.module.css';

export default function RequestReceipt({ event }: { event: TerminalEvent }) {
  const { lang } = useLang();
  const t = useT();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const { allowMotion } = useMotionPolicy();
  useEffect(() => { titleRef.current?.focus(); }, []);
  useGSAP(() => {
    if (!allowMotion) return;
    gsap.from('[data-receipt-line]', { scaleX: 0, duration: 0.2, ease: 'steps(8)' });
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });

  return <section ref={rootRef} className={styles.receipt} aria-labelledby="request-receipt-title">
      <div className={styles.receiptBody}>
        <span aria-hidden="true" data-receipt-line className={styles.receiptLine} />
        <h2 ref={titleRef} id="request-receipt-title" tabIndex={-1}>{t.request.committed}</h2>
        <p className={styles.receiptEvent}>{event.session}</p>
        <p>{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US')} · {event.time}</p>
        <p>{event.venue}</p>
      </div>
    <div className={styles.nextSteps}>
      <p>{t.request.committedSub}</p>
      <TerminalActionLink href={`/gate?event=${encodeURIComponent(event.id)}`}>{lang === 'ko' ? '이벤트로 돌아가기' : 'Back to event'}</TerminalActionLink>
    </div>
  </section>;
}
