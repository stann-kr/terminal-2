'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout, { itemVariants } from '@/components/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import ReturnLink from '@/components/ui/ReturnLink';
import TerminalPanel from '@/components/TerminalPanel';
import TerminalButton from '@/components/TerminalButton';
import SubmitButton from '@/components/SubmitButton';
import { LabelText, MetaText, SubtitleText } from '@/components/ui/TerminalText';
import { FormField, inputClassBase, inputAccentClass } from '@/components/ui/FormField';
import { useLang, useT } from '@/lib/langContext';
import type { TerminalEvent } from '@/lib/eventData';

const ACCESS_WINDOW_DAYS = 30;

interface FormState {
  name: string;
  email: string;
  instagram: string;
  invitedBy: string;
  accessCode: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
}

function RequestAccessContent() {
  const { lang } = useLang();
  const t = useT();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<TerminalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [daysUntil, setDaysUntil] = useState(0);
  const [artistNames, setArtistNames] = useState<string[]>([]);
  const [otherInviter, setOtherInviter] = useState('');

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    instagram: '',
    invitedBy: '',
    accessCode: searchParams.get('code') ?? '',
    privacyConsent: false,
    marketingConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/events?status=UPCOMING')
      .then(res => { if (!res.ok) throw new Error(); return res.json() as Promise<TerminalEvent[]>; })
      .then(async data => {
        if (data.length > 0) {
          const ev = data[0];
          setEvent(ev);
          const days = (new Date(ev.date).getTime() - Date.now()) / 86_400_000;
          setDaysUntil(Math.ceil(days));
          setIsActive(days >= 0 && days <= ACCESS_WINDOW_DAYS);

          const artistRes = await fetch(`/api/artists?eventId=${ev.id}`);
          if (artistRes.ok) {
            const rows = await artistRes.json() as { name: string; status: string }[];
            setArtistNames(rows.filter(a => a.status === 'CONFIRMED').map(a => a.name));
          }
        }
      })
      .catch(() => setError(t.common.signalUnstable))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof Omit<FormState, 'privacyConsent'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');

    if (!form.invitedBy) {
      setError(t.request.errors.INVITER_REQUIRED);
      return;
    }
    if (form.invitedBy === '__OTHER__' && !otherInviter.trim()) {
      setError(t.request.errors.INVITER_REQUIRED);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const resolvedInvitedBy = form.invitedBy === '__OTHER__'
      ? otherInviter.trim()
      : form.invitedBy;

    try {
      const res = await fetch('/api/gate/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, invitedBy: resolvedInvitedBy }),
      });

      const data = await res.json() as { ok?: boolean; error?: string };

      if (!res.ok) {
        const errKey = data.error ?? '';
        setError(
          t.request.errors[errKey as keyof typeof t.request.errors] ?? t.request.errors.TRANSMISSION_FAILED
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setError(t.request.errors.CONNECTION_ERROR);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const invitationLines = event?.invitationLines?.[lang] ?? t.request.invitationLines;

  return (
    <PageLayout centerContent={false}>
      <ReturnLink variants={itemVariants} />
      <PageHeader
        path="/terminal/gate/request"
        title="ACCESS.REQUEST"
        accent="secondary"
        variants={itemVariants}
      />

      {loading ? (
        <motion.div variants={itemVariants} className="text-xs font-mono text-terminal-muted text-center py-8">
          <LabelText text={t.request.loading} />
        </motion.div>
      ) : !isActive ? (
        /* 비활성 기간 안내 */
        <motion.div variants={itemVariants}>
          <TerminalPanel title="REQUEST_STATUS" accent="alert">
            <div className="space-y-3 text-center py-4">
              <div className="text-sm font-bold tracking-widest font-mono text-terminal-accent-alert">
                <LabelText text={t.request.periodInactive} />
              </div>
              <div className="text-xs font-mono text-terminal-muted space-y-1">
                {event ? (
                  <>
                    <div>
                      <MetaText text={t.request.windowInfo(ACCESS_WINDOW_DAYS)} />
                    </div>
                    <div>
                      <MetaText text={t.request.eventDate(event.date.replace(/-/g, '.'), event.time)} />
                    </div>
                    <div className="pt-1 text-terminal-accent-primary">
                      <MetaText text={t.request.windowCountdown(daysUntil - ACCESS_WINDOW_DAYS)} />
                    </div>
                  </>
                ) : (
                  <MetaText text={t.request.noEvent} />
                )}
              </div>
            </div>
          </TerminalPanel>
        </motion.div>
      ) : submitted ? (
        /* 제출 성공 */
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <TerminalPanel title="REQUEST_COMMITTED" accent="secondary">
            <div className="text-center py-6 space-y-2">
              <div className="text-sm font-bold tracking-widest font-mono text-terminal-accent-secondary">
                <LabelText text={t.request.committed} />
              </div>
              <div className="text-xs font-mono text-terminal-muted">
                <MetaText text={t.request.committedSub} />
              </div>
            </div>
          </TerminalPanel>
        </motion.div>
      ) : (
        /* 활성 폼 */
        <div className="space-y-4">
          {/* 초대 메시지 */}
          <motion.div variants={itemVariants}>
            <TerminalPanel title="INVITATION_BRIEF" accent="secondary">
              <div className="space-y-1.5">
                {invitationLines.map((line, i) => (
                  <div key={i} className="font-mono text-terminal-subdued tracking-wide">
                    <SubtitleText text={line} delay={i * 40} />
                  </div>
                ))}
              </div>
            </TerminalPanel>
          </motion.div>

          {/* 신청 폼 */}
          <motion.div variants={itemVariants}>
            <TerminalPanel title="GUEST_REQUEST_FORM" accent="secondary">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* 이름 */}
                <FormField label={t.request.labelName}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder={t.request.placeholderName}
                    className={`${inputClassBase} ${inputAccentClass.secondary}`}
                  />
                </FormField>

                {/* 이메일 */}
                <FormField label={t.request.labelEmail}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder={t.request.placeholderEmail}
                    className={`${inputClassBase} ${inputAccentClass.secondary}`}
                  />
                </FormField>

                {/* 인스타그램 */}
                <FormField label={t.request.labelInstagram}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none select-none font-mono text-small md:text-body text-terminal-accent-secondary">
                      @
                    </span>
                    <input
                      type="text"
                      value={form.instagram.replace(/^@/, '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^@+/, '');
                        setForm(prev => ({ ...prev, instagram: raw ? '@' + raw : '' }));
                      }}
                      placeholder="USERNAME"
                      className={`${inputClassBase} ${inputAccentClass.secondary} pl-6`}
                    />
                  </div>
                </FormField>

                {/* 초대인 */}
                <FormField label={t.request.labelInvitedBy}>
                  <div className="relative">
                  <select
                    value={form.invitedBy}
                    onChange={e => setForm(prev => ({ ...prev, invitedBy: e.target.value }))}
                    className={`${inputClassBase} ${inputAccentClass.secondary} appearance-none`}
                  >
                    <option value="">{t.request.selectInviter}</option>
                    {artistNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="__OTHER__">{t.request.optionOther}</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-terminal-accent-secondary/70 select-none">
                    ▾
                  </span>
                  </div>
                  {form.invitedBy === '__OTHER__' && (
                    <input
                      type="text"
                      value={otherInviter}
                      onChange={e => setOtherInviter(e.target.value)}
                      placeholder={t.request.placeholderOtherInviter}
                      className={`${inputClassBase} ${inputAccentClass.secondary} mt-2`}
                    />
                  )}
                </FormField>

                {/* 인증 코드 */}
                <FormField label={t.request.labelCode}>
                  <input
                    type="text"
                    value={form.accessCode}
                    onChange={handleChange('accessCode')}
                    placeholder={t.request.placeholderCode}
                    className={`${inputClassBase} ${inputAccentClass.secondary}`}
                  />
                </FormField>

                {/* 개인정보 동의 */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={form.privacyConsent}
                        onChange={e => setForm(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border font-mono text-xs flex items-center justify-center transition-colors ${
                        form.privacyConsent
                          ? 'border-terminal-accent-secondary bg-terminal-accent-secondary/20 text-terminal-accent-secondary'
                          : 'border-terminal-accent-secondary/30 text-transparent'
                      }`}>
                        ✓
                      </div>
                    </div>
                    <span className="font-mono text-terminal-subdued leading-relaxed group-hover:text-terminal-primary transition-colors">
                      <MetaText autoHeight text={t.request.privacyConsent} />
                    </span>
                  </label>
                </div>

                {/* 마케팅 동의 (선택) */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={form.marketingConsent}
                        onChange={e => setForm(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border font-mono text-xs flex items-center justify-center transition-colors ${
                        form.marketingConsent
                          ? 'border-terminal-accent-secondary bg-terminal-accent-secondary/20 text-terminal-accent-secondary'
                          : 'border-terminal-accent-secondary/30 text-transparent'
                      }`}>
                        ✓
                      </div>
                    </div>
                    <span className="font-mono text-terminal-subdued leading-relaxed group-hover:text-terminal-primary transition-colors">
                      <MetaText autoHeight text={t.request.marketingConsent} />
                    </span>
                  </label>
                </div>

                {/* 에러 메시지 */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-mono text-terminal-accent-alert"
                    >
                      <LabelText text={`⚠ ERROR: ${error}`} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 제출 버튼 */}
                <div className="flex justify-end pt-2">
                  <SubmitButton
                    isSubmitting={isSubmitting}
                    variant="primary"
                    defaultText={t.request.submitBtn}
                    loadingText={t.request.submitting}
                  />
                </div>
              </form>
            </TerminalPanel>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
}

export default function RequestAccessPage() {
  return (
    <Suspense>
      <RequestAccessContent />
    </Suspense>
  );
}
