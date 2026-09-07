'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LabelText } from './ui/TerminalText';
import styles from './TerminalButton.module.css';
import { useControlMotion } from './ui/useControlMotion';

export type TerminalButtonVariant = 'primary' | 'ghost' | 'danger';

interface TerminalButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: TerminalButtonVariant;
}

export function getTerminalButtonClassName(
  variant: TerminalButtonVariant = 'primary',
  className = '',
) {
  return `min-h-11 font-mono text-small px-5 py-2.5 ${styles.control} ${styles[variant]} ${className}`;
}

export function TerminalControlContent({ children }: { children: ReactNode }) {
  return <>
    <span aria-hidden="true" data-control-scan className={styles.scan} />
    <span data-control-label className={styles.label}>
      {typeof children === 'string' ? <LabelText text={children} autoHeight className="text-small" /> : children}
    </span>
    <span aria-hidden="true" data-control-arrow className={styles.arrow}>↵</span>
  </>;
}

export default function TerminalButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...buttonProps
}: TerminalButtonProps) {
  const rootRef = useControlMotion<HTMLButtonElement>();
  return (
    <button
      ref={rootRef}
      type={type}
      {...buttonProps}
      className={getTerminalButtonClassName(variant, className)}
    >
      <TerminalControlContent>{children}</TerminalControlContent>
    </button>
  );
}
