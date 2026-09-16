import { useEffect, useState } from 'react';
import { getPreviewEvents, readLocation, type Lang, type Scenario, type ScreenProps } from './events/data';
import { Shell } from './shell/Shell';
import { Gate, Home } from './events/EventScreens';
import { Lineup } from './lineup/Lineup';
import { ContactForm } from './forms/ContactForm';
import { Transmit } from './transmit/Transmit';
import { About, Channels, Status } from './info/InfoScreens';
import { NoEvent } from './shared/Ui';
import { EntryExperience } from './entry/EntryExperience';
import { chooseEntryLanguage, detectBrowserLanguage, readEntryVisit } from './entry/visitState';
import { MotionProvider } from './motion/MotionProvider';
import './base.css';

export default function App() {
  const [route, setRoute] = useState(readLocation);
  const [languagePreference, setLanguagePreference] = useState<Lang | null>(() => readEntryVisit().lang ?? null);
  const [detectedLanguage] = useState(detectBrowserLanguage);
  const lang = languagePreference ?? detectedLanguage.lang;
  const setLang = (value: Lang) => { chooseEntryLanguage(value); setLanguagePreference(value); };
  const [crt, setCrt] = useState(true);
  const [entryRun, setEntryRun] = useState(0);
  const [scenario, setScenario] = useState<Scenario>('snapshot');
  const [failSubmission, setFailSubmission] = useState(false);
  const [samples, setSamples] = useState(false);
  const [poster, setPoster] = useState('');
  const [posterError, setPosterError] = useState(false);
  useEffect(() => {
    const change = () => setRoute(readLocation());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => () => { if (poster) URL.revokeObjectURL(poster); }, [poster]);
  const previewEntry = (mode: 'boot' | 'idle') => {
    setEntryRun(run => run + 1);
    window.location.hash = `/entry?mode=${mode}`;
  };
  const t = (ko: string, en: string) => lang === 'ko' ? ko : en;
  const events = getPreviewEvents(scenario);
  const event = route.eventId ? events.find(item => item.id === route.eventId) ?? null : events[0] ?? null;
  const props: ScreenProps = { event, events, t, lang, scenario };
  const eventPage = ['home', 'gate', 'lineup', 'request', 'status'].includes(route.page);
  const errorPage = scenario === 'error' && eventPage;
  return <MotionProvider crt={crt}><div className="tm-preview">
    <div className="tm-review" hidden={route.page === 'entry'}><strong>{t('목업 / ASPEN GRID', 'MOCKUP / ASPEN GRID')}</strong><span className="tm-review-note">{t('로컬 스냅샷 · 입력은 실제 전송되지 않습니다', 'Local snapshot · Forms do not send data')}</span><details><summary>{t('검토 옵션', 'Preview options')} · {scenario === 'snapshot' ? '2026.09.15' : t('가정 상태', 'SIMULATION')}</summary><div className="tm-review-options"><button type="button" className="tm-button" onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); previewEntry('boot'); }}>{t('부팅 다시 보기', 'Replay boot sequence')}</button><button type="button" className="tm-button" onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); previewEntry('idle'); }}>{t('IDLE 화면 보기', 'Preview idle screen')}</button><label>{t('데이터 상태', 'Data scenario')}<select value={scenario} onChange={e => setScenario(e.target.value as Scenario)}><option value="snapshot">{t('기본 · 지난 행사 2개', 'Default · Two past events')}</option><option value="upcoming">{t('접수 기간 가정 · 2026.05.01', 'Request window · May 1, 2026')}</option><option value="live">{t('진행 중 가정', 'Live event simulation')}</option><option value="empty">{t('공개 행사 없음', 'No published events')}</option><option value="error">{t('불러오기 실패', 'Loading failure')}</option><option value="long">{t('긴 행사명 예시', 'Long event title sample')}</option></select></label><label>{t('제출 결과', 'Submission result')}<select value={failSubmission ? 'error' : 'success'} onChange={e => setFailSubmission(e.target.value === 'error')}><option value="success">{t('완료 예시', 'Success preview')}</option><option value="error">{t('실패 · 초안 유지', 'Failure · Retain draft')}</option></select></label><label>{t('방명록 내용', 'Guestbook content')}<select value={samples ? 'sample' : 'empty'} onChange={e => setSamples(e.target.value === 'sample')}><option value="empty">{t('작성한 글만', 'Your preview entries')}</option><option value="sample">{t('목업 예시 7개 추가', 'Add seven sample entries')}</option></select></label><label>{t('포스터 배치 확인 · 로컬 이미지', 'Poster layout · Local image')}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { const file = e.target.files?.[0]; if (file && file.type.startsWith('image/')) { setPoster(URL.createObjectURL(file)); setPosterError(false); } }} /></label><button className="tm-button" type="button" onClick={() => { setPoster(''); setPosterError(false); }}>{t('포스터 없이 보기', 'Remove poster')}</button><button className="tm-button" type="button" onClick={() => setPosterError(true)}>{t('이미지 오류 복귀 확인', 'Simulate image failure')}</button><p>{t('기본 데이터: 2026.09.15 로컬 행사 스냅샷. 접수·진행 상태와 방명록 예시는 검토용 가정입니다. 포스터는 이 브라우저에서만 사용합니다.', 'Default: local event snapshot dated September 15, 2026. Live/request scenarios and sample messages are simulations. Poster files stay in this browser.')}</p></div></details></div>
    <Shell page={route.page} viewKey={route.page === 'entry' ? `entry:${route.entryMode}:${entryRun}` : route.page} motionKey={`${route.page}:${route.page === 'lineup' ? '' : event?.id}:${scenario}:${lang}:${poster}:${posterError}`} lang={lang} t={t} setLang={setLang} crt={crt} toggleCrt={() => setCrt(value => !value)}>
      {route.page === 'entry' && <div data-active="true"><EntryExperience key={`${route.entryMode}:${entryRun}`} mode={route.entryMode} lang={lang} t={t} languageOrigin={languagePreference ? 'manual' : detectedLanguage.origin} onComplete={() => { window.location.hash = '/home'; }} /></div>}
      {errorPage ? <section data-active="true" className="tm-empty"><p className="tm-eyebrow">{route.page.toUpperCase()} / LOAD ERROR</p><h1 data-motion-title tabIndex={-1}>{t('정보를 불러오지 못했습니다.', 'Could not load information.')}</h1><p>{t('연결을 확인한 뒤 다시 시도해 주세요.', 'Check your connection and try again.')}</p><button type="button" className="tm-button" onClick={() => setScenario('snapshot')}>{t('다시 시도', 'Retry')}</button></section> : <>
        {route.page === 'home' && <div data-active="true">{route.eventId && !event ? <NoEvent t={t} invalid /> : <Home {...props} poster={posterError ? 'data:image/png;base64,invalid' : poster} />}</div>}
        {route.page === 'gate' && <div data-active="true"><Gate {...props} poster={posterError ? 'data:image/png;base64,invalid' : poster} /></div>}
        {route.page === 'lineup' && <div data-active="true"><Lineup {...props} artistId={route.artistId} /></div>}
        {route.page === 'status' && <div data-active="true"><Status {...props} /></div>}
      </>}
      <div hidden={route.page !== 'request' || errorPage} data-active={route.page === 'request' && !errorPage}><ContactForm {...props} kind="request" failSubmission={failSubmission} active={route.page === 'request' && !errorPage} /></div>
      <div hidden={route.page !== 'signal'} data-active={route.page === 'signal'}><ContactForm {...props} kind="signal" failSubmission={failSubmission} active={route.page === 'signal'} /></div>
      <div hidden={route.page !== 'transmit'} data-active={route.page === 'transmit'}><Transmit t={t} failSubmission={failSubmission} samples={samples} active={route.page === 'transmit'} /></div>
      {route.page === 'about' && <div data-active="true"><About {...props} /></div>}
      {route.page === 'link' && <div data-active="true"><Channels {...props} /></div>}
    </Shell>
  </div></MotionProvider>;
}
