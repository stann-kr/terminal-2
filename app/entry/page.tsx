'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/langContext';
import { useUrlQueryState } from '@/lib/useUrlQueryState';
import { EntryExperience } from '@/features/terminal/entry/EntryExperience';

export default function EntryPage() {
  const router = useRouter();
  const { lang } = useLang();
  const [mode] = useUrlQueryState('mode');
  const [ready, setReady] = useState(false);
  const [languageOrigin, setLanguageOrigin] = useState<'manual' | 'browser' | 'fallback'>('fallback');
  useEffect(() => {
    try {
      const stored = localStorage.getItem('terminal_lang');
      setLanguageOrigin(stored === 'ko' || stored === 'en' ? 'manual'
        : navigator.languages.some(locale => /^(ko|en)(-|$)/i.test(locale)) ? 'browser' : 'fallback');
    } catch { /* Entry works without local storage. */ }
    setReady(true);
  }, []);
  if (!ready) return <section className="tm-empty"><h1 tabIndex={-1}>TERMINAL</h1></section>;
  return <EntryExperience key={mode} mode={mode === 'boot' || mode === 'idle' ? mode : 'auto'} lang={lang} t={(ko, en) => lang === 'ko' ? ko : en} languageOrigin={languageOrigin} onComplete={() => router.push('/home')} />;
}
