'use client';

import PageLayout from '@/components/shell/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import ReturnLink from '@/components/ui/ReturnLink';
import TerminalPanel from '@/components/TerminalPanel';
import TerminalButton from '@/components/TerminalButton';
import SubmitButton from '@/components/SubmitButton';
import ConsentCheckbox from '@/components/ui/ConsentCheckbox';
import ConsentBlock from '@/components/ui/ConsentBlock';
import FieldError from '@/components/ui/FieldError';
import { FormField, inputClassBase, inputAccentClass } from '@/components/ui/FormField';
import { formatEventDate } from '@/lib/events/lifecycle';
import type { TerminalEvent } from '@/lib/events/types';
import { ACCESS_WINDOW_DAYS } from '@/lib/gate/requestPolicy';
import { useAccessRequest } from './useAccessRequest';
import RequestStatusPanel from './RequestStatusPanel';
import RequestReceipt from './RequestReceipt';
import styles from './RequestPage.module.css';

export default function RequestAccessPage() {
  const {
    t,
    lang,
    event,
    gateHref,
    needsTargetReview,
    isRefreshingEvent,
    nextEvent,
    acceptNextEvent,
    eventState,
    retryEvent,
    invitationLines,
    form,
    codeState,
    isCodeVerified,
    codeError,
    codeStatus,
    verifyCode,
    handleCodeChange,
    handleTextChange,
    handleInstagramChange,
    handlePrivacyConsentChange,
    handleMarketingConsentChange,
    handleSubmit,
    isSubmitting,
    submitted,
    fieldErrors,
    formError,
  } = useAccessRequest();

  return (
    <PageLayout centerContent={false} width="event" flush>
      <div className={styles.returnBar}><ReturnLink href={gateHref} text={lang === 'ko' ? '이벤트로 돌아가기' : 'Back to event'} /></div>
      <PageHeader path="/gate/request" title={lang === 'ko' ? '게스트 신청' : 'Guest request'} accent="secondary" />

      {event && !submitted && <RequestEventSummary event={event} lang={lang} />}

      {submitted && event ? (
        <RequestReceipt event={event} />
      ) : eventState.kind === 'loading' ? (
        <p className={styles.state} role="status">{t.request.loading}</p>
      ) : eventState.kind === 'load-error' ? (
        <div className={`${styles.state} space-y-4`} role="alert">
          <p>{t.request.eventLoadFailed}</p>
          <TerminalButton onClick={retryEvent} variant="ghost">{t.request.retry}</TerminalButton>
        </div>
      ) : eventState.kind === 'empty' ? (
        <p className={styles.state} role="status">{t.request.noEvent}</p>
      ) : (
        <div className={styles.workspace} data-inactive={eventState.kind === 'inactive' && !needsTargetReview}>
          <div className={styles.formColumn}>
          {needsTargetReview && (
            <section className={styles.review} aria-labelledby="request-target-title">
              <h2 id="request-target-title" className="text-lg font-semibold">
                {lang === 'ko' ? '신청 대상을 다시 확인해 주세요' : 'Review the request event'}
              </h2>
              <p role="alert">
                {lang === 'ko'
                  ? '신청 대상 또는 접수 상태가 바뀌었습니다. 입력한 내용은 유지됩니다. 현재 행사를 확인한 뒤 인증 코드를 다시 확인해 주세요.'
                  : 'The request event or its application status has changed. Your draft is preserved. Review the current event, then verify your access code again.'}
              </p>
              {nextEvent ? (
                <>
                  <RequestEventSummary event={nextEvent} lang={lang} />
                  <TerminalButton onClick={acceptNextEvent} variant="primary">
                    {lang === 'ko' ? '이 행사로 신청 계속' : 'Continue with this event'}
                  </TerminalButton>
                </>
              ) : <p role="status">{isRefreshingEvent ? t.request.loading : t.request.noEvent}</p>}
              <TerminalButton onClick={retryEvent} variant="ghost">
                {lang === 'ko' ? '신청 정보 새로고침' : 'Refresh request information'}
              </TerminalButton>
            </section>
          )}
          {eventState.kind === 'inactive' && !needsTargetReview ? (
            <section className={`${styles.state} space-y-3`} role="status">
              <h2 className="text-lg font-semibold">{t.request.periodInactive}</h2>
              <p>{t.request.windowInfo(ACCESS_WINDOW_DAYS)}</p>
              <p>{eventState.window.isElapsed ? t.request.eventElapsed : t.request.windowCountdown(eventState.window.opensInDays ?? 0)}</p>
            </section>
          ) : (
            <>
              <section className={styles.introduction}>
                {invitationLines.filter(line => /[a-zA-Z가-힣ㄱ-ㆎ\d]/.test(line)).map((line, index) => <p key={index}>{line}</p>)}
                <p className="font-medium">
                  {lang === 'ko' ? '신청 접수는 입장 확정을 뜻하지 않습니다.' : 'Submitting a request does not confirm admission.'}
                </p>
              </section>
              <TerminalPanel title={lang === 'ko' ? '신청 정보' : 'Your details'} accent="secondary" headingLevel={2} className={styles.formPanel} bodyClassName={styles.formBody}>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <FormField label={t.request.labelCode} htmlFor="request-accessCode">
                  <div className="relative">
                    <input
                      id="request-accessCode"
                      name="accessCode"
                      type="text"
                      value={form.accessCode}
                      onChange={handleCodeChange}
                      placeholder={t.request.placeholderCode}
                      autoComplete="off"
                      maxLength={64}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(codeError)}
                      aria-describedby={`${codeError || codeStatus ? 'request-accessCode-message ' : ''}request-code-help`}
                      className={`${inputClassBase} ${inputAccentClass.secondary} pr-8`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-caption pointer-events-none" aria-hidden="true">
                      {codeState.kind === 'verifying' ? (
                        <span className="text-terminal-muted">···</span>
                      ) : isCodeVerified ? (
                        <span className="text-terminal-accent-secondary">✓</span>
                      ) : form.accessCode ? (
                        <span className="text-terminal-accent-alert">✗</span>
                      ) : null}
                    </span>
                  </div>
                </FormField>
                <p id="request-code-help" className={styles.codeHelp}>{lang === 'ko' ? '코드 확인 후 이름과 연락처를 작성할 수 있습니다.' : 'Verify your code to enter your name and contact details.'}</p>
                {(codeError || codeStatus) && (
                  <div
                    id="request-accessCode-message"
                    className={`font-mono ${codeError ? 'text-terminal-accent-alert' : 'text-terminal-accent-secondary'}`}
                    role={codeError ? 'alert' : 'status'}
                    aria-live="polite"
                  >
                    {codeError ?? codeStatus ?? ''}
                    {codeState.kind === 'unavailable' && (
                      <TerminalButton className="ml-3 px-3 py-1 text-micro" variant="ghost" onClick={() => verifyCode(form.accessCode)}>
                        {t.request.retry}
                      </TerminalButton>
                    )}
                  </div>
                )}

                {form.accessCode.trim() && codeState.kind === 'idle' && !needsTargetReview && (
                  <TerminalButton variant="ghost" onClick={() => verifyCode(form.accessCode)}>
                    {lang === 'ko' ? '인증 코드 다시 확인' : 'Verify access code again'}
                  </TerminalButton>
                )}
                <div>
                  <div className="space-y-4">
                    <FormField label={t.request.labelName} htmlFor="request-name">
                      <input
                        id="request-name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleTextChange('name')}
                        placeholder={t.request.placeholderName}
                        autoComplete="name"
                        required
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? 'request-name-error' : undefined}
                        disabled={!isCodeVerified}
                        className={`${inputClassBase} ${inputAccentClass.secondary}`}
                      />
                    </FormField>
                    {fieldErrors.name && <FieldError id="request-name-error" message={fieldErrors.name} />}

                    <FormField label={t.request.labelEmail} htmlFor="request-email">
                      <input
                        id="request-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleTextChange('email')}
                        placeholder={t.request.placeholderEmail}
                        autoComplete="email"
                        required
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? 'request-email-error' : undefined}
                        disabled={!isCodeVerified}
                        className={`${inputClassBase} ${inputAccentClass.secondary}`}
                      />
                    </FormField>
                    {fieldErrors.email && <FieldError id="request-email-error" message={fieldErrors.email} />}

                    <FormField label={t.request.labelInstagram} htmlFor="request-instagram">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none select-none font-mono text-small md:text-body text-terminal-accent-secondary" aria-hidden="true">@</span>
                        <input
                          id="request-instagram"
                          name="instagram"
                          type="text"
                          value={form.instagram.replace(/^@/, '')}
                          onChange={handleInstagramChange}
                          placeholder="USERNAME"
                          autoComplete="username"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(fieldErrors.instagram)}
                          aria-describedby={fieldErrors.instagram ? 'request-instagram-error' : undefined}
                          disabled={!isCodeVerified}
                          className={`${inputClassBase} ${inputAccentClass.secondary} pl-6`}
                        />
                      </div>
                    </FormField>
                    {fieldErrors.instagram && <FieldError id="request-instagram-error" message={fieldErrors.instagram} />}

                    <FormField label={t.request.labelInvitedBy} htmlFor="request-invitedBy">
                      <output
                        id="request-invitedBy"
                        htmlFor="request-accessCode"
                        aria-live="off"
                        className="flex min-h-11 items-center gap-3 border border-terminal-accent-secondary/30 px-3 py-2 font-mono text-small tracking-wider text-terminal-primary"
                      >
                        <span className="text-terminal-accent-secondary" aria-hidden="true">
                          {isCodeVerified ? '✓' : '○'}
                        </span>
                        {codeState.kind === 'verified' ? codeState.artistName : '—'}
                      </output>
                    </FormField>

                    <ConsentBlock>
                      <ConsentCheckbox
                        id="request-privacyConsent"
                        name="privacyConsent"
                        checked={form.privacyConsent}
                        onChange={handlePrivacyConsentChange}
                        label={t.request.privacyConsent}
                        disabled={!isCodeVerified}
                        required
                        aria-invalid={Boolean(fieldErrors.privacyConsent)}
                        aria-describedby={fieldErrors.privacyConsent ? 'request-privacyConsent-error' : undefined}
                      />
                      {fieldErrors.privacyConsent && <FieldError id="request-privacyConsent-error" message={fieldErrors.privacyConsent} />}
                      <ConsentCheckbox
                        id="request-marketingConsent"
                        name="marketingConsent"
                        checked={form.marketingConsent}
                        onChange={handleMarketingConsentChange}
                        label={t.request.marketingConsent}
                        disabled={!isCodeVerified}
                      />
                    </ConsentBlock>
                  </div>
                </div>

                  {formError && (
                    <div className="text-terminal-accent-alert" role="alert">
                      {formError}
                    </div>
                  )}

                <div className="flex justify-end pt-2">
                  <SubmitButton isSubmitting={isSubmitting} disabled={!isCodeVerified} variant="primary" className="w-full" defaultText={t.request.submitBtn} loadingText={t.request.submitting} />
                </div>
              </form>
              </TerminalPanel>
            </>
          )}
          </div>
          {(eventState.kind !== 'inactive' || needsTargetReview) && <RequestStatusPanel codeState={codeState} isCodeVerified={isCodeVerified} needsTargetReview={needsTargetReview} isSubmitting={isSubmitting} />}
        </div>
      )}
    </PageLayout>
  );
}

function RequestEventSummary({ event, lang }: { event: TerminalEvent; lang: 'ko' | 'en' }) {
  return (
    <section className={styles.eventStrip} aria-label={lang === 'ko' ? '신청 대상 행사' : 'Request event'}>
      <h2 className="text-2xl font-semibold leading-tight">{event.session}</h2>
      {event.subtitle && <p>{event.subtitle}</p>}
      <p>{formatEventDate(event, lang === 'ko' ? 'ko-KR' : 'en-US')} · {event.time}</p>
      <p>{event.venue}{event.district ? ` · ${event.district}` : ''}</p>
    </section>
  );
}
