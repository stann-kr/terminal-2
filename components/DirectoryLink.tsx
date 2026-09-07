'use client';
import Link from 'next/link';
import { useLang } from '@/lib/langContext';
interface DirectoryLinkProps {
  href: string; label: string; description: string; index: number;
  accent?: 'primary' | 'secondary' | 'warn' | 'alert' | 'tertiary'; external?: boolean;
}
export default function DirectoryLink({ href, label, description, external = false }: DirectoryLinkProps) {
  const { lang } = useLang();
  const content = <><span className="min-w-0 flex-1"><span className="block text-heading">{label}</span><span className="block mt-1 text-small text-terminal-subdued">{description}</span></span><span className="w-[8ch] text-right shrink-0 text-caption font-mono text-terminal-subdued group-hover:text-terminal-primary group-focus-visible:text-terminal-primary transition-colors duration-[160ms]">{external ? (lang === 'ko' ? '새 탭 ↗' : 'Open ↗') : '→'}</span></>;
  const className = 'group flex items-center gap-3 min-h-11 py-5 border-b border-terminal-bg-panel-border hover:text-white focus-visible:text-white transition-colors duration-[160ms]';
  return external ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a> : <Link href={href} className={className}>{content}</Link>;
}
