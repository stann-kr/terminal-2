'use client';

import Link from 'next/link';
import {
  getTerminalButtonClassName,
  TerminalControlContent,
  type TerminalButtonVariant,
} from '@/components/TerminalButton';
import { useControlMotion } from './ui/useControlMotion';

interface TerminalActionLinkProps {
  href: string;
  children: string;
  variant?: TerminalButtonVariant;
  className?: string;
}

export default function TerminalActionLink({
  href,
  children,
  variant = 'primary',
  className = '',
}: TerminalActionLinkProps) {
  const rootRef = useControlMotion<HTMLAnchorElement>();
  return (
    <Link ref={rootRef} href={href} className={getTerminalButtonClassName(variant, className)}>
      <TerminalControlContent>{children}</TerminalControlContent>
    </Link>
  );
}
