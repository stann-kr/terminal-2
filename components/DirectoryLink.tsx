'use client';
import Link from 'next/link';
import { useLang } from '@/lib/langContext';
import styles from './DirectoryLink.module.css';
interface DirectoryLinkProps {
  href: string; label: string; description: string; index: number;
  accent?: 'primary' | 'secondary' | 'warn' | 'alert' | 'tertiary'; external?: boolean;
}
export default function DirectoryLink({ href, label, description, index, external = false }: DirectoryLinkProps) {
  const { lang } = useLang();
  const content = (
    <>
      <span aria-hidden="true" className={styles.index}>{String(index).padStart(2, '0')}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.description}>{description}</span>
      <span className={styles.action}>
        {external && <span>{lang === 'ko' ? '새 탭' : 'Open'}</span>}
        <span aria-hidden="true" className={styles.arrow}>{external ? '↗' : '↵'}</span>
      </span>
    </>
  );
  const className = styles.link;
  return external ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a> : <Link href={href} className={className}>{content}</Link>;
}
