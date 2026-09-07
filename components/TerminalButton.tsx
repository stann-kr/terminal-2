'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LabelText } from './ui/TerminalText';
import styles from './TerminalButton.module.css';

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

export default function TerminalButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...buttonProps
}: TerminalButtonProps) {
  return (
    <button
      type={type}
      {...buttonProps}
      className={getTerminalButtonClassName(variant, className)}
    >
      {typeof children === 'string' ? (
        <LabelText text={children} autoHeight className="text-small" />
      ) : (
        children
      )}
    </button>
  );
}
