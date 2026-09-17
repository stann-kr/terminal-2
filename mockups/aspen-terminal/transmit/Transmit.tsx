import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ScreenProps } from '../events/data';
import { PageHeading } from '../shared/Ui';
import { useReadoutMotion } from '../motion/useReadoutMotion';
import { PendingIndicator } from '../motion/PendingIndicator';
import './transmit.css';

interface Entry { id: number; alias: string; message: string; sample: boolean }
const examples: Entry[] = Array.from({ length: 7 }, (_, i) => ({ id: -i - 1, alias: `SAMPLE_${String(i + 1).padStart(2, '0')}`, message: `레이아웃 확인용 방명록 예시 ${i + 1}. / Guestbook layout sample ${i + 1}.`, sample: true }));
export function Transmit({ t, lang, failSubmission, samples, active }: Pick<ScreenProps, 't' | 'lang'> & { failSubmission: boolean; samples: boolean; active: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState({ alias: '', message: '' });
  const [page, setPage] = useState(0);
  const [error, setError] = useState<'required' | 'submit' | 'page' | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const all = [...entries, ...(samples ? examples : [])];
  const maxPage = Math.max(0, Math.ceil(all.length / 3) - 1);
  const currentPage = Math.min(page, maxPage);
  useReadoutMotion(logRef, { key: `${lang}:${currentPage}:${samples}:${entries[0]?.id}`, active, content: ':scope', layout: true });
  useReadoutMotion(formRef, { key: `${error}:${sent}`, contentKey: lang, active, content: ':scope', updates: '.tm-field-error,[role=status]', layout: true });
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (!draft.alias.trim() || !draft.message.trim()) {
      setError('required');
      (draft.alias.trim() ? messageRef.current : aliasRef.current)?.focus();
      return;
    }
    setPending(true); setError(null); setSent(false);
    const entry = { alias: draft.alias.trim(), message: draft.message.trim() };
    timer.current = setTimeout(() => {
      setPending(false);
      if (failSubmission) setError('submit');
      else { setEntries(previous => [{ ...entry, id: (previous[0]?.id ?? 0) + 1, sample: false }, ...previous]); setDraft({ alias: '', message: '' }); setPage(0); setSent(true); }
    }, 450);
  };
  const changePage = (next: number) => {
    if (next > currentPage && failSubmission) { setError('page'); return; }
    setPage(next); setError(null);
  };
  return <><PageHeading code="TRANSMIT / PUBLIC GUESTBOOK" title={t('방명록', 'Guestbook')} /><div className="tm-transmit-grid"><section className="tm-transmit-compose tm-cell"><h2 data-motion-copy>{t('글 남기기', 'Leave a message')}</h2><p className="tm-prose">{t('별칭과 메시지는 누구나 볼 수 있는 방명록에 게시됩니다. 연락처 등 개인정보를 남기지 마세요.', 'Your alias and message appear in the public guestbook. Do not include contact details or private information.')}</p><form data-readout-region ref={formRef} onSubmit={submit} noValidate aria-busy={pending}><label htmlFor="transmit-alias">{t('별칭', 'Alias')}</label><input ref={aliasRef} id="transmit-alias" value={draft.alias} maxLength={40} required disabled={pending} aria-invalid={error === 'required' && !draft.alias.trim()} aria-describedby={error === 'required' ? 'transmit-error' : undefined} onChange={e => { setDraft({ ...draft, alias: e.target.value }); setError(null); setSent(false); }} /><label htmlFor="transmit-message">{t('메시지', 'Message')}<span>{draft.message.length}/280</span></label><textarea ref={messageRef} id="transmit-message" value={draft.message} maxLength={280} rows={6} required disabled={pending} aria-invalid={error === 'required' && !draft.message.trim()} aria-describedby={error === 'required' ? 'transmit-error' : undefined} onChange={e => { setDraft({ ...draft, message: e.target.value }); setError(null); setSent(false); }} />{error && error !== 'page' && <p className="tm-field-error" role="alert" id="transmit-error">{error === 'required' ? t('별칭과 메시지를 입력해 주세요.', 'Enter your alias and message.') : t('전송 실패 예시입니다. 초안은 유지됩니다.', 'Simulated failure. Your draft is retained.')}</p>}<p className="tm-form-hint" role="status">{sent ? t('목업에 메시지를 추가했습니다. 실제 게시되지 않습니다.', 'Message added to the preview. It has not been published.') : t('이 목업에서는 입력이 외부로 전송되지 않습니다.', 'This preview does not send your input anywhere.')}</p><button type="submit" className="tm-action" disabled={pending}><span>{pending ? t('처리 중…', 'Processing…') : t('메시지 게시', 'Post message')}</span>{pending && <PendingIndicator active={active} />}</button></form></section><section data-readout-region ref={logRef} className="tm-transmit-log tm-cell" aria-labelledby="transmit-log-title"><div className="tm-log-header"><h2 id="transmit-log-title">{t('게시 기록', 'Messages')}</h2><span className="tm-eyebrow">{all.length} {t('개', 'ENTRIES')}</span></div>{all.length ? <ol start={currentPage * 3 + 1}>{all.slice(currentPage * 3, currentPage * 3 + 3).map(entry => <li key={entry.id}><div><h3>{entry.alias}</h3><span>{entry.sample ? t('목업 예시', 'SAMPLE') : t('이번 목업에서 작성', 'PREVIEW ONLY')}</span></div><p>{entry.message}</p></li>)}</ol> : <div className="tm-log-empty"><span aria-hidden="true">[00]</span><p>{t('게시된 글이 없습니다.', 'No messages yet.')}</p></div>}{error === 'page' && <p className="tm-field-error" role="alert">{t('다음 페이지를 불러오지 못했습니다. 현재 글과 초안은 유지됩니다.', 'Could not load the next page. Current messages and draft are retained.')}</p>}{maxPage > 0 && <nav className="tm-log-pagination" aria-label={t('방명록 페이지', 'Guestbook pages')}><button className="tm-button" disabled={currentPage === 0} onClick={() => changePage(currentPage - 1)}><span>{t('이전', 'Previous')}</span></button><span>{currentPage + 1} / {maxPage + 1}</span><button className="tm-button" disabled={currentPage >= maxPage} onClick={() => changePage(currentPage + 1)}><span>{t('다음', 'Next')}</span></button></nav>}</section></div></>;
}
