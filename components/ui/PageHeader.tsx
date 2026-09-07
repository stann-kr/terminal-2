'use client';
import { motion, Variants } from 'framer-motion';
import { HeadingText } from '@/components/ui/TerminalText';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  path: string;
  title: string;
  accent?: 'primary' | 'secondary' | 'alert' | 'warn' | 'tertiary';
  variants?: Variants;
  cipher?: boolean;
}

const defaultVariants = {
  hidden: {},
  visible: {},
};

const accentClassMap: Record<NonNullable<PageHeaderProps['accent']>, string> = {
  primary:   'text-terminal-accent-primary text-shadow-glow-primary',
  secondary: 'text-terminal-accent-secondary text-shadow-glow-secondary',
  alert:     'text-terminal-accent-alert text-shadow-glow-alert',
  warn:      'text-terminal-accent-warn text-shadow-glow-warn',
  tertiary:  'text-terminal-accent-tertiary text-shadow-glow-tertiary',
};

export default function PageHeader({ path, title, accent = 'primary', variants = defaultVariants, cipher = false }: PageHeaderProps) {
  const accentClass = accentClassMap[accent] || accentClassMap.primary;
  return (
    <motion.div variants={variants} className={styles.header}>
      <p className={styles.path}><span aria-hidden="true">&gt;</span> {path}</p>
      <HeadingText
        text={title}
        cipher={cipher}
        autoHeight
        className={`font-orbit text-h1 md:text-title tracking-normal ${accentClass.split(' ')[0]} ${styles.title}`}
      />
    </motion.div>
  );
}
