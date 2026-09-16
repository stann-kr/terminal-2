import { useEffect, useRef, useState } from 'react';
import { href, type EntryMode, type Lang, type Translate } from '../events/data';
import { STARTUP_LINES, HANDOFF_LINES, useBootSequence } from './useBootSequence';
import { completeEntryVisit, readEntryVisit } from './visitState';
import './entry.css';

interface EntryProps { lang: Lang; t: Translate; crt: boolean; languageOrigin: 'manual' | 'browser' | 'fallback'; onComplete: () => void }

function Identity({ t, idle = false }: { t: Translate; idle?: boolean }) {
  return <div className="tm-entry-identity tm-cell">
    <p className="tm-eyebrow">TERMINAL / {idle ? 'IDLE' : 'VISUAL BOOT SEQUENCE'}</p>
    <h1 tabIndex={-1}>TER<br />MINAL</h1>
    <div className="tm-entry-signature"><p>SEOUL / TECHNO</p><p>{idle ? t('이벤트와 라인업을 계속 둘러보세요.', 'Continue exploring events and artists.') : 'A VOYAGE TO THE UNKNOWN SECTOR'}</p></div>
  </div>;
}

function Boot({ t, lang, languageOrigin, onComplete, crt }: EntryProps) {
  const root = useRef<HTMLElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const sequence = useBootSequence(root, crt);
  const { phase, startupCount, handoffCount } = sequence;
  const running = phase === 'startup' || phase === 'handoff';
  const step = phase === 'startup' ? '01' : '02';

  useEffect(() => {
    if (document.visibilityState === 'hidden') return;
    const focused = document.activeElement;
    // Console progress must not pull focus away from a shell or review control.
    if (focused !== document.body && !root.current?.contains(focused)) return;
    if (phase === 'ready') enterRef.current?.focus();
  }, [phase]);

  return <section ref={root} className="tm-entry" data-phase={phase} data-motion={sequence.allowMotion} aria-label={t('부팅 시퀀스', 'Boot sequence')}>
    <Identity t={t} />
    <div className="tm-boot-console tm-cell">
      <div className="tm-boot-toolbar"><p className="tm-eyebrow">[{step}] / {phase === 'startup' ? 'INITIALIZE' : 'ENTER TERMINAL'}</p><a className="tm-text-link" href={href('home')}>{t('이벤트 바로 보기', 'View events now')} ↗</a></div>
      <div className="tm-boot-output" aria-label={t('부팅 출력', 'Boot output')}>
        <p className="tm-boot-prompt">TERMINAL INTERFACE <span>/ VISUAL SEQUENCE</span></p>
        <ol className="tm-boot-lines">{STARTUP_LINES.slice(0, startupCount).map(([label, result]) => <li key={label}><span>{label}</span><i aria-hidden="true" /><span>{label === 'LOCALE CONFIGURATION' ? lang.toUpperCase() : result}</span></li>)}</ol>
        {(phase === 'handoff' || phase === 'ready') && <>
          <ol className="tm-boot-lines">{HANDOFF_LINES.slice(0, handoffCount).map(([label, result]) => <li key={label}><span>{label}</span><i aria-hidden="true" /><span>{result}</span></li>)}</ol>
        </>}
        {running && <span className="tm-boot-cursor" aria-hidden="true">▌</span>}
      </div>
      <div className="tm-boot-progress" aria-hidden="true" hidden={!running}><span data-entry-progress /></div>
      <div className="tm-boot-interaction">
        <p className="tm-boot-language-set">LANGUAGE / {lang.toUpperCase()}<span>{languageOrigin === 'manual' ? t('직접 선택한 언어', 'Your saved language') : languageOrigin === 'browser' ? t('브라우저 언어 자동 감지', 'Detected from browser preferences') : t('기본 언어', 'Default language')}</span></p>
        {phase === 'ready' && <div className="tm-boot-ready"><p>{t('화면이 준비되었습니다.', 'The interface is ready.')}</p><button ref={enterRef} type="button" className="tm-action" onClick={onComplete}><span>[ ENTER TERMINAL ]</span><span aria-hidden="true">↗</span></button></div>}
      </div>
      <div className="tm-boot-bottom"><span className="tm-eyebrow">{t('터미널 체험', 'TERMINAL EXPERIENCE')}</span><button type="button" className="tm-button" disabled={!running} onClick={sequence.skip}>{t('애니메이션 건너뛰기', 'Skip animation')}</button></div>
      <p className="tm-sr-only" role="status">{phase === 'ready' ? t('부팅 연출 완료. ENTER TERMINAL 버튼으로 진입하세요.', 'Sequence complete. Select ENTER TERMINAL to continue.') : t('부팅 연출 진행 중', 'Visual boot sequence in progress')}</p>
    </div>
    <div data-entry-power className="tm-entry-power" aria-hidden="true" />
  </section>;
}

function Idle({ t, onComplete }: EntryProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      if (document.visibilityState === 'hidden') return;
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), 1000);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return <section className="tm-entry tm-entry-idle" aria-label={t('대기 화면', 'Idle screen')}>
    <Identity t={t} idle />
    <div className="tm-idle-content tm-cell"><p className="tm-eyebrow">SEOUL_TIME / KST</p><div className="tm-idle-time" role="timer" aria-live="off"><time dateTime={now.toISOString()}>{clock}</time><p>{date}</p></div><div className="tm-idle-return"><p className="tm-eyebrow">TERMINAL / IDLE</p><h2>{t('다시 오셨군요.', 'Welcome back.')}</h2><button type="button" className="tm-action" onClick={onComplete}><span>{t('이벤트로 돌아가기', 'Return to events')}</span><span aria-hidden="true">↗</span></button></div></div>
  </section>;
}

export function EntryExperience({ mode, ...props }: EntryProps & { mode: EntryMode }) {
  const [idle] = useState(() => mode === 'idle' || (mode === 'auto' && readEntryVisit().visited));
  const completed = useRef(false);
  const complete = () => {
    if (completed.current) return;
    completed.current = true;
    completeEntryVisit();
    props.onComplete();
  };
  return idle ? <Idle {...props} onComplete={complete} /> : <Boot {...props} onComplete={complete} />;
}
