'use client';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalPanel from '@/components/TerminalPanel';
import TerminalButton from '@/components/TerminalButton';
import SubmitButton from '@/components/SubmitButton';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import FieldError from '@/components/ui/FieldError';
import { FormField, inputClassBase, inputAccentClass } from '@/components/ui/FormField';
import { useTransmit } from './useTransmit';
import { useMotionPolicy } from '@/lib/useMotionPolicy';
import styles from './TransmitPage.module.css';

function formatLocalTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} / ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TransmitPage() {
  const { allowMotion } = useMotionPolicy();
  const {
    t, currentPage, handle, message, sent, fieldErrors, formError, logs, total, totalPages,
    isInitialLoad, isFetching, isLogError, isSubmitting, handleHandleChange, handleMessageChange,
    handleSubmit, retryLogs, showPreviousPage, showNextPage,
  } = useTransmit();

  return <PageLayout width="event" flush>
    <PageHeader path="/transmit" title={t.transmit.title} />
    <div className={styles.workspace}>
      <TerminalPanel title={t.transmit.formTitle} className={styles.editor}>
        <p id="transmit-public-notice" className={styles.notice}>{t.transmit.publicNotice}</p>
        <form onSubmit={handleSubmit} noValidate aria-describedby="transmit-public-notice" className={styles.form}>
          <FormField label={t.transmit.labelAlias} htmlFor="transmit-handle">
            <input id="transmit-handle" name="handle" type="text" value={handle} onChange={handleHandleChange} placeholder={t.transmit.placeholderAlias} autoComplete="nickname" required aria-required="true" aria-invalid={Boolean(fieldErrors.handle)} aria-describedby={fieldErrors.handle ? 'transmit-handle-error' : undefined} maxLength={24} className={`${inputClassBase} ${inputAccentClass.secondary}`} />
          </FormField>
          {fieldErrors.handle && <FieldError id="transmit-handle-error" message={fieldErrors.handle} />}
          <div>
            <div className={styles.messageHeader}><label htmlFor="transmit-message">{t.transmit.labelMessage}</label><span id="transmit-message-count">{message.length} / 280</span></div>
            <textarea id="transmit-message" name="message" value={message} onChange={handleMessageChange} placeholder={t.transmit.placeholderMsg} autoComplete="off" required aria-required="true" aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? 'transmit-message-error transmit-message-count' : 'transmit-message-count'} maxLength={280} rows={5} className={`${inputClassBase} ${inputAccentClass.primary} ${styles.textarea}`} />
          </div>
          {fieldErrors.message && <FieldError id="transmit-message-error" message={fieldErrors.message} />}
          <AnimatePresence initial={false}>
            {formError && <motion.p key="error" initial={allowMotion ? { opacity: 0.7 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: allowMotion ? 0.16 : 0 }} className={styles.error} role="alert">{formError}</motion.p>}
            {sent && <motion.p key="sent" initial={allowMotion ? { opacity: 0.7 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: allowMotion ? 0.16 : 0 }} className={styles.sent} role="status" aria-live="polite" aria-atomic="true">{t.transmit.committed}</motion.p>}
          </AnimatePresence>
          <div className={styles.submit}><SubmitButton isSubmitting={isSubmitting} defaultText={t.transmit.submitBtn} loadingText={t.transmit.submitting} className="w-full" /></div>
        </form>
      </TerminalPanel>
      <TerminalPanel title={isInitialLoad ? t.transmit.logSyncing : isLogError ? t.transmit.title : t.transmit.logTitle(total)} accent="secondary" className={styles.logPanel}>
        {isInitialLoad ? <p role="status" className={styles.state}>{t.transmit.syncing}</p>
          : isLogError ? <div role="alert" className={styles.state}><p>{t.transmit.logLoadFailed}</p><TerminalButton variant="ghost" onClick={retryLogs}>{t.transmit.retry}</TerminalButton></div>
          : logs.length === 0 ? <p role="status" className={styles.state}>{t.transmit.noEntries}</p>
          : <ol className={styles.logs} aria-busy={isFetching}>{logs.map(entry => <li key={entry.id}>
            <div className={styles.logHeader}><span>{entry.handle}</span><time dateTime={entry.createdAt}>{formatLocalTime(entry.createdAt)}</time></div>
            <p>{entry.message}</p>
          </li>)}</ol>}
        {(totalPages > 1 || currentPage > 1) && <nav className={styles.pagination} aria-label={t.transmit.title}>
          <TerminalButton variant="ghost" aria-label={t.transmit.previousPageLabel} onClick={showPreviousPage} disabled={currentPage <= 1 || isFetching || isInitialLoad || isSubmitting}>{t.transmit.prevBtn}</TerminalButton>
          <span aria-live="polite">{isLogError ? currentPage : `${currentPage} / ${Math.max(currentPage, totalPages)}`}</span>
          <TerminalButton variant="ghost" aria-label={t.transmit.nextPageLabel} onClick={showNextPage} disabled={currentPage >= totalPages || isFetching || isInitialLoad || isLogError || isSubmitting}>{t.transmit.nextBtn}</TerminalButton>
        </nav>}
      </TerminalPanel>
    </div>
  </PageLayout>;
}
