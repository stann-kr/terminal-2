'use client';
import Link from 'next/link';
import PageLayout from '@/components/shell/PageLayout';
import ReturnLink from '@/components/ui/ReturnLink';
import PageHeader from '@/components/ui/PageHeader';
import { useLang, useT } from '@/lib/langContext';
export default function AboutPage() {
  const t = useT();
  const { lang } = useLang();
  return <PageLayout><ReturnLink /><PageHeader path="/terminal/about" title={lang === 'ko' ? 'TERMINAL 소개' : 'About TERMINAL'} /><div className="space-y-6 max-w-prose">{t.manifesto.map((line, i) => <p key={i} className="text-body">{line}</p>)}</div><Link href="/link" className="mt-8 min-h-11 inline-flex items-center self-start underline">{lang === 'ko' ? '공식 채널' : 'Official channels'}</Link></PageLayout>;
}
