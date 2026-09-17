'use client';
import { useLang, type Lang } from '@/lib/langContext';

interface LangToggleProps {
  className?: string;
}

export default function LangToggle({ className = '' }: LangToggleProps) {
  const { lang, setLang } = useLang();

  const btn = (target: Lang, label: string) => {
    const active = lang === target;
    return (
      <button
        type="button"
        onClick={() => setLang(target)}
        aria-pressed={active}
        className={`min-w-11 min-h-11 px-2 py-1 font-mono text-small tracking-normal transition-colors duration-[var(--os-dur-fast)] cursor-pointer ${
          active
            ? 'text-terminal-bg-base bg-terminal-accent-primary'
            : 'text-terminal-subdued hover:text-terminal-primary hover:bg-terminal-accent-primary/10'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div role="group" aria-label="Language / 언어" className={`inline-flex items-center border border-terminal-accent-primary/30 ${className}`}>
      {btn('ko', 'KO')}
      {btn('en', 'EN')}
    </div>
  );
}
