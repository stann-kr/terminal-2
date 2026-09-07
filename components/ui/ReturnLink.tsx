'use client';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { LabelText } from '@/components/ui/TerminalText';
import { useLang } from '@/lib/langContext';

interface ReturnLinkProps {
  href?: string;
  text?: string;
  variants?: Variants;
}

const defaultVariants = {
  hidden: {},
  visible: {},
};

export default function ReturnLink({ href = '/home', text, variants = defaultVariants }: ReturnLinkProps) {
  const { lang } = useLang();
  return (
    <motion.div variants={variants} className="mb-6">
      <Link
        href={href}
        className="font-mono text-small cursor-pointer inline-flex items-center gap-2 min-h-11 py-2 transition-colors duration-[var(--os-dur-fast)] text-terminal-subdued hover:text-terminal-primary"
      >
        <span aria-hidden="true">[←]</span>
        <LabelText text={text ?? (lang === 'ko' ? '홈으로' : 'Home')} autoHeight className="text-small" />
      </Link>
    </motion.div>
  );
}
