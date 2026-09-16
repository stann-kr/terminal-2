import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { validateSignalSubscriptionInput } from '../../../lib/signal/subscriptionPolicy';
import { requestKo, requestEn, signalKo, signalEn } from '../../../lib/i18n';
import { getRequestWindowState } from '../../../lib/events/lifecycle';
import { ACCESS_WINDOW_DAYS } from '../../../lib/gate/requestPolicy';
import { scenarioClock, type ScreenProps } from '../events/data';
import { Action, EventState } from '../shared/Ui';
import { useReadoutMotion } from '../motion/useReadoutMotion';
import { PendingIndicator } from '../motion/PendingIndicator';
import { TerminalText } from '../motion/TerminalText';
import './forms.css';

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div className="tm-form-field"><label htmlFor={id}>{label}</label>{children}{error && <p id={`${id}-error`} className="tm-field-error">{error}</p>}</div>;
}

export function ContactForm(props: ScreenProps & { kind: 'request' | 'signal'; failSubmission: boolean; active: boolean }) {
  const { event, t, lang, kind, scenario, failSubmission, active } = props;
  const request = kind === 'request';
  const copy = lang === 'ko' ? signalKo : signalEn;
  const requestCopy = lang === 'ko' ? requestKo : requestEn;
  const [fields, setFields] = useState({ code: '', name: '', email: '', instagram: '', consent: false, marketing: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifiedEvent, setVerifiedEvent] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [receipt, setReceipt] = useState<{ session: string; name: string; email: string; date: string; time: string; venue: string; eventId?: string } | null>(null);
  const contextEvent = receipt ?? event;
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const targetKey = request ? `${event?.id ?? ''}:${scenario}` : 'signal';
  const [previousTarget, setPreviousTarget] = useState(targetKey);
  const verified = !request || Boolean(event && verifiedEvent === event.id);
  const canRequest = event?.status === 'UPCOMING' && getRequestWindowState(event, ACCESS_WINDOW_DAYS, scenarioClock(scenario)).isActive;
  useReadoutMotion(inputRef, {
    key: `${lang}:${targetKey}:${Boolean(canRequest)}:${Boolean(receipt)}:${verified}:${failed}:${codeError}:${Object.values(errors).filter(Boolean).join(',')}`,
    active, contentKey: `${lang}:${targetKey}:${Boolean(canRequest)}`, content: ':scope', updates: '.tm-contact-result,.tm-field-error,.tm-form-hint',
  });
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // Reset only target-bound state during render; the contact draft stays intact.
  if (targetKey !== previousTarget) {
    setPreviousTarget(targetKey);
    setPending(false);
    setVerifiedEvent('');
    setCodeError(false);
    setFailed(false);
  }
  // A stale timer must not produce a receipt for a different target or period.
  useEffect(() => {
    generation.current += 1;
    if (timer.current) clearTimeout(timer.current);
  }, [targetKey]);
  useEffect(() => { if (receipt && active) resultRef.current?.focus(); }, [receipt, active]);
  const update = (key: keyof typeof fields, value: string | boolean) => {
    setFields(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: '' }));
    setFailed(false);
    if (key === 'code') { setVerifiedEvent(''); setCodeError(false); }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending || (request && (!canRequest || !verified))) return;
    const validation = validateSignalSubscriptionInput({ email: fields.email, instagram: fields.instagram, consent: fields.consent });
    const next: Record<string, string> = {};
    if (!validation.ok) Object.assign(next, validation.fieldErrors);
    if (request && !fields.name.trim()) next.name = 'REQUIRED';
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setPending(true); setFailed(false);
    const target = { session: event?.session ?? '', date: event?.date ?? '', time: event?.time ?? '', venue: event?.venue ?? '', eventId: event?.id, name: fields.name.trim(), email: fields.email.trim() };
    const attempt = generation.current;
    timer.current = setTimeout(() => {
      if (attempt !== generation.current) return;
      setPending(false);
      if (failSubmission) setFailed(true);
      else setReceipt(target);
    }, 450);
  };
  const errorText = (field: string) => errors[field] === 'REQUIRED' ? t('이름을 입력해 주세요.', 'Enter your name.') : (copy.errors[errors[field] as keyof typeof copy.errors] ?? '');
  const fieldProps = (field: 'name' | 'email' | 'instagram') => ({ id: `${kind}-${field}`, name: field, value: fields[field], onChange: (e: React.ChangeEvent<HTMLInputElement>) => update(field, e.target.value), required: true, 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `${kind}-${field}-error` : undefined });
  if (request && !canRequest && !receipt) return <section className="tm-form-closed tm-cell"><p className="tm-eyebrow">GUEST_REQ / {event?.id ?? 'NO EVENTS'}</p><h1 data-motion-title tabIndex={-1}>{t('현재 신청 가능한\n이벤트가 없습니다.', 'No events are open\nfor guest requests.')}</h1>{event && <div className="tm-closed-event"><EventState event={event} t={t} /><h2>{event.session}</h2><p>{event.date} / {event.time} / {event.venue}</p></div>}<div className="tm-action-group"><Action page="gate" event={event?.id}>{t('이벤트 정보', 'Event details')}</Action><Action page="signal" secondary>{t('이벤트 소식 받기', 'Get event updates')}</Action></div></section>;
  return <div className="tm-contact-grid">
    <section className="tm-contact-context tm-cell"><p className="tm-eyebrow">TERMINAL / {request ? 'GUEST_REQ' : 'SIGNAL'}</p><h1 data-motion-title tabIndex={-1}><TerminalText>{request ? 'GUEST\nREQUEST' : 'EVENT\nUPDATES'}</TerminalText></h1><div data-motion-copy className="tm-contact-context-bottom"><h2>{request ? t('게스트 신청', 'Guest request') : t('이벤트 소식 받기', 'Get event updates')}</h2>{request && contextEvent ? <><h3>{contextEvent.session}</h3><p className="tm-contact-meta">{contextEvent.date} / {contextEvent.time}<br />{contextEvent.venue}</p>{!receipt && <div className="tm-contact-notice"><p>{t('초대인에게 받은 인증 코드를 입력해 주세요.', 'Enter the access code from your inviter.')}</p><p>{requestCopy.committedSub}</p></div>}</> : <div className="tm-prose">{copy.description.map(line => <p key={line}>{line}</p>)}</div>}</div></section>
    <section data-readout-region ref={inputRef} className="tm-contact-input tm-cell">
      {receipt ? <div className="tm-contact-result"><p className="tm-eyebrow">{t('목업 결과', 'PREVIEW RESULT')}</p><h2 ref={resultRef} tabIndex={-1}><TerminalText>{request ? t('신청 접수 완료', 'Request received') : t('소식 신청 완료', 'Subscription received')}</TerminalText></h2><p>{t('목업에서만 완료되었습니다. 실제로 전송되거나 저장되지 않습니다.', 'Completed in this preview. Nothing was sent or saved to the service.')}</p>{request && <><p>{requestCopy.committedSub}</p><dl><div><dt>{t('신청 이벤트', 'Requested event')}</dt><dd>{receipt.session}</dd></div><div><dt>{t('이름', 'Name')}</dt><dd>{receipt.name}</dd></div></dl></>}<p>{receipt.email}</p><Action page={request ? 'gate' : 'home'} event={receipt.eventId}>{t('이벤트로 돌아가기', 'Back to event')}</Action><button type="button" className="tm-button" onClick={() => { setReceipt(null); requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input')?.focus()); }}><span>{t('목업 다시 입력', 'Try the form again')}</span></button></div> : <form ref={formRef} className="tm-contact-form" onSubmit={submit} noValidate aria-busy={pending}>
        <h2 className="tm-eyebrow">{request ? t('신청 정보', 'REQUEST DETAILS') : t('연락처 등록', 'CONTACT DETAILS')}</h2>
        {request && <div className="tm-code-block"><Field id="request-code" label={t('인증 코드', 'Access code')} error={codeError ? t('코드를 확인해 주세요.', 'Check the access code.') : undefined}><div className="tm-code-row"><input id="request-code" name="code" value={fields.code} autoComplete="off" autoCapitalize="characters" aria-invalid={codeError} aria-describedby={codeError ? 'request-code-error' : 'request-code-hint'} onChange={e => update('code', e.target.value)} disabled={pending} /><button type="button" className="tm-button" disabled={pending || !fields.code.trim()} onClick={() => { const valid = fields.code.trim().toUpperCase() === 'DEMO02'; setCodeError(!valid); setVerifiedEvent(valid ? event!.id : ''); }}><span>{t('확인', 'Verify')}</span></button></div></Field><p id="request-code-hint" className="tm-form-hint" role="status">{verified ? t('코드 확인됨 · 목업 초대인 STANN LUMO', 'Code verified · Preview inviter STANN LUMO') : t('목업 체험 코드: DEMO02', 'Preview access code: DEMO02')}</p></div>}
        <fieldset data-motion-controls disabled={!verified || pending} className="tm-contact-fields"><legend className="tm-sr-only">{t('연락처와 동의', 'Contact and consent')}</legend>
          {request && <Field id="request-name" label={t('이름', 'Name')} error={errorText('name')}><input {...fieldProps('name')} autoComplete="name" maxLength={100} /></Field>}
          <Field id={`${kind}-email`} label={t('이메일', 'Email')} error={errorText('email')}><input {...fieldProps('email')} type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" spellCheck={false} /></Field>
          <Field id={`${kind}-instagram`} label={t('인스타그램 ID', 'Instagram ID')} error={errorText('instagram')}><input {...fieldProps('instagram')} autoCapitalize="none" autoComplete="off" maxLength={31} placeholder="@username" spellCheck={false} /></Field>
          <div className="tm-consent"><label><input id={`${kind}-consent`} type="checkbox" required checked={fields.consent} onChange={e => update('consent', e.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? `${kind}-consent-error` : undefined} /><span>{request ? requestCopy.privacyConsent : copy.consentLabel}</span></label>{errors.consent && <p className="tm-field-error" id={`${kind}-consent-error`}>{errorText('consent')}</p>}</div>
          {request && <div className="tm-consent"><label><input type="checkbox" checked={fields.marketing} onChange={e => update('marketing', e.target.checked)} /><span>{requestCopy.marketingConsent}</span></label></div>}
        </fieldset>
        {request && verified && <p className="tm-form-hint">{t('신청 대상', 'Request for')}: {event?.session} / {event?.date}</p>}
        {failed && <p className="tm-field-error" role="alert">{t('전송 실패 예시입니다. 입력은 유지됩니다. 다시 시도할 수 있습니다.', 'Simulated submission failure. Your draft is retained; you can retry.')}</p>}
        <div className="tm-sr-only" role="status">{Object.values(errors).some(Boolean) ? t('입력 항목을 확인해 주세요.', 'Check the form fields.') : ''}</div>
        <button className="tm-action tm-submit" disabled={pending || !verified} type="submit"><span>{pending ? t('처리 중…', 'Processing…') : request ? t('신청 제출', 'Submit request') : t('소식 신청', 'Subscribe')}</span>{pending && <PendingIndicator active={active} />}</button>
      </form>}
    </section>
  </div>;
}
