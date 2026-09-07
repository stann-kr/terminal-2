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
        className="text-small cursor-pointer inline-flex items-center min-h-11 px-3 py-2 border transition-colors border-terminal-bg-panel-border text-terminal-primary hover:bg-terminal-bg-panel-border/20"
      >
        <LabelText text={text ?? (lang === 'ko' ? '홈으로' : 'Home')} autoHeight />
      </Link>
    </motion.div>
  );
}
