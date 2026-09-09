'use client';
import { useEffect, useRef } from 'react';
import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import TerminalPanel from '@/components/TerminalPanel';
import SubmitButton from '@/components/SubmitButton';
import TerminalActionLink from '@/components/TerminalActionLink';
import ConsentCheckbox from '@/components/ui/ConsentCheckbox';
import ConsentBlock from '@/components/ui/ConsentBlock';
import FieldError from '@/components/ui/FieldError';
import { FormField, inputClassBase, inputAccentClass } from '@/components/ui/FormField';
import { useLang } from '@/lib/langContext';
import { useSignalSubscription } from './useSignalSubscription';
import styles from './SignalPage.module.css';

export default function SignalPage() {
  const { lang } = useLang();
  const { t, form, handleEmailChange, handleInstagramChange, handleConsentChange, handleSubmit, isSubmitting, submitted, fieldErrors, formError } = useSignalSubscription();
  const resultRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (submitted) resultRef.current?.focus(); }, [submitted]);

  return <PageLayout width="event" flush>
    <div className={styles.page}>
    <PageHeader path="/signal" title={lang === 'ko' ? '소식 신청' : 'Event updates'} />
    {submitted ? <section className={styles.result} aria-labelledby="signal-result-title">
      <h2 id="signal-result-title" ref={resultRef} tabIndex={-1}>{t.signal.committed}</h2>
      <p>{t.signal.committedSub}</p>
      <TerminalActionLink href="/gate">{lang === 'ko' ? '이벤트 보기' : 'Explore events'}</TerminalActionLink>
    </section> : <div className={styles.workspace}>
      <div className={styles.introduction}>
        {t.signal.description.map((line, i) => <p key={i}>{line}</p>)}
      </div>
      <TerminalPanel title={lang === 'ko' ? '연락처 등록' : 'Your contact details'} accent="secondary" className={styles.contactPanel} bodyClassName={styles.formBody}>
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <FormField label={t.signal.labelEmail} htmlFor="signal-email">
            <input id="signal-email" name="email" type="email" value={form.email} onChange={handleEmailChange} placeholder={t.signal.placeholderEmail} autoComplete="email" required aria-required="true" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'signal-email-error' : undefined} className={`${inputClassBase} ${inputAccentClass.secondary}`} />
          </FormField>
          {fieldErrors.email && <FieldError id="signal-email-error" message={fieldErrors.email} />}
          <FormField label={t.signal.labelInstagram} htmlFor="signal-instagram">
            <div className={styles.instagram}>
              <span aria-hidden="true">@</span>
              <input id="signal-instagram" name="instagram" type="text" value={form.instagram.replace(/^@/, '')} onChange={handleInstagramChange} placeholder="USERNAME" autoComplete="username" required aria-required="true" aria-invalid={Boolean(fieldErrors.instagram)} aria-describedby={fieldErrors.instagram ? 'signal-instagram-error' : undefined} className={`${inputClassBase} ${inputAccentClass.secondary}`} />
            </div>
          </FormField>
          {fieldErrors.instagram && <FieldError id="signal-instagram-error" message={fieldErrors.instagram} />}
          <ConsentBlock>
            <ConsentCheckbox id="signal-consent" name="consent" checked={form.consent} onChange={handleConsentChange} label={t.signal.consentLabel} required aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? 'signal-consent-error' : undefined} />
            {fieldErrors.consent && <FieldError id="signal-consent-error" message={fieldErrors.consent} />}
          </ConsentBlock>
          {formError && <p role="alert" className={styles.error}>{formError}</p>}
          <SubmitButton isSubmitting={isSubmitting} defaultText={t.signal.submitBtn} loadingText={t.signal.submitting} className="w-full" />
        </form>
      </TerminalPanel>
    </div>}
    </div>
  </PageLayout>;
}
