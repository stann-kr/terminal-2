'use client';
import Link from 'next/link';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import TerminalActionLink from '@/components/TerminalActionLink';
import { useLang, useT } from '@/lib/langContext';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  const t = useT();
  const { lang } = useLang();
  return <PageLayout width="event" flush>
    <PageHeader path="/about" title={lang === 'ko' ? 'TERMINAL 소개' : 'About TERMINAL'} />
    <div className={styles.layout}>
      <div className={styles.identity} aria-hidden="true"><p className={styles.wordmark}>TERMINAL</p><p>SEOUL / TECHNO</p></div>
      <div className={styles.copy}>{t.manifesto.map((line, i) => <p key={i}>{line}</p>)}
        <div className={styles.links}><TerminalActionLink href="/gate">{lang === 'ko' ? '이벤트 보기' : 'Explore events'}</TerminalActionLink><TerminalActionLink variant="ghost" href="/link">{lang === 'ko' ? '공식 채널' : 'Official channels'}</TerminalActionLink></div>
        <Link href="/?experience=terminal" className={styles.experience}>{lang === 'ko' ? '터미널 체험' : 'Terminal experience'} <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </PageLayout>;
}
