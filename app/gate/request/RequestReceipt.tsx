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
    gsap.from('[data-receipt-line]', { scaleX: 0, duration: 0.55, ease: 'expo.out' });
  }, { scope: rootRef, dependencies: [allowMotion], revertOnUpdate: true });

  return <section ref={rootRef} className={styles.receipt} aria-labelledby="request-receipt-title">
    <div className={styles.outcome}>
      <p aria-hidden="true" className={styles.receiptCode}>REQUEST_RECEIVED <span>[OK]</span></p>
      <div className={styles.receiptBody}>
        <span aria-hidden="true" data-receipt-line className={styles.receiptLine} />
        <h2 ref={titleRef} id="request-receipt-title" tabIndex={-1}>{t.request.committed}</h2>
        <p className={styles.receiptEvent}>{event.session}</p>
        <p>{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US')} · {event.time}</p>
        <p>{event.venue}</p>
      </div>
    </div>
    <div className={styles.nextSteps}>
      <h3>{lang === 'ko' ? '다음 안내' : 'What happens next'}</h3>
      <p>{t.request.committedSub}</p>
      <p>{lang === 'ko' ? '이벤트 정보와 라인업을 계속 확인할 수 있습니다.' : 'You can continue exploring the event and lineup.'}</p>
      <TerminalActionLink href={`/gate?event=${encodeURIComponent(event.id)}`}>{lang === 'ko' ? '이벤트로 돌아가기' : 'Back to event'}</TerminalActionLink>
      <TerminalActionLink variant="ghost" href={`/lineup?event=${encodeURIComponent(event.id)}`}>{lang === 'ko' ? '라인업 보기' : 'View lineup'}</TerminalActionLink>
    </div>
  </section>;
}
