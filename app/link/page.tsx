'use client';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import DirectoryLink from '@/components/DirectoryLink';
import { useT, useLang } from '@/lib/langContext';
import styles from './LinkPage.module.css';

export default function LinkPage() {
  const t = useT();
  const { lang } = useLang();
  const links = [
    { href: 'https://stann.kr', label: 'STANN OS Hub', description: t.link.descriptions.stannHub },
    { href: 'https://lumo.stann.kr', label: 'Stann Lumo Web', description: t.link.descriptions.stannWeb },
    { href: 'https://www.instagram.com/stannlumo/', label: 'Stann Lumo Instagram', description: t.link.descriptions.stannInsta },
    { href: 'https://www.instagram.com/terminal_hub/', label: 'Terminal Instagram', description: t.link.descriptions.terminalInsta },
  ];
  return <PageLayout width="event" flush>
    <PageHeader path="/link" title={lang === 'ko' ? '공식 채널' : 'Official channels'} />
    <nav aria-label={t.link.externalChannels} className={styles.directory}>
      <div className={styles.directoryHeader}><span aria-hidden="true">EXTERNAL_CHANNELS</span><span>{lang === 'ko' ? `${links.length}개 채널` : `${links.length} channels`}</span></div>
      {links.map((link, i) => <DirectoryLink key={link.href} {...link} index={i + 1} external />)}
    </nav>
  </PageLayout>;
}
