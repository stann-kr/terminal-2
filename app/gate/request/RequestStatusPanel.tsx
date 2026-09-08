'use client';
import type { CodeVerificationState } from './requestState';
import { useLang } from '@/lib/langContext';
import styles from './RequestPage.module.css';

export default function RequestStatusPanel({ codeState, isCodeVerified, needsTargetReview, isSubmitting }: {
  codeState: CodeVerificationState; isCodeVerified: boolean; needsTargetReview: boolean; isSubmitting: boolean;
}) {
  const { lang } = useLang();
  const codeLabel = needsTargetReview
    ? (lang === 'ko' ? '신청 대상을 다시 확인해 주세요.' : 'Review the request event.')
    : codeState.kind === 'verifying' ? (lang === 'ko' ? '코드를 확인하고 있습니다.' : 'Checking your code.')
    : codeState.kind === 'invalid' ? (lang === 'ko' ? '코드를 수정해 주세요.' : 'Check the code you entered.')
    : codeState.kind === 'unavailable' ? (lang === 'ko' ? '연결 확인 후 다시 시도해 주세요.' : 'Check your connection and try again.')
    : isCodeVerified && codeState.kind === 'verified' ? codeState.artistName
    : (lang === 'ko' ? '초대인에게 받은 코드를 입력해 주세요.' : 'Enter the code from your inviter.');
  return <aside className={styles.statusPanel} aria-labelledby="request-status-title">
    <h2 id="request-status-title">{lang === 'ko' ? '신청 상태' : 'Request status'}<span aria-hidden="true">[REQ]</span></h2>
    <ol className={styles.steps}>
      <li data-complete={isCodeVerified}><span aria-hidden="true">01</span><div><h3>{lang === 'ko' ? '인증 코드 확인' : 'Verify code'}</h3><p>{codeLabel}</p></div></li>
      <li><span aria-hidden="true">02</span><div><h3>{lang === 'ko' ? '신청 정보 작성' : 'Your details'}</h3><p>{isCodeVerified ? (lang === 'ko' ? '이름과 연락처를 확인하고 동의 항목을 읽어주세요.' : 'Check your name, contact details and consent.') : (lang === 'ko' ? '코드 확인 후 작성할 수 있습니다.' : 'Available after code verification.')}</p></div></li>
      <li><span aria-hidden="true">03</span><div><h3>{lang === 'ko' ? '신청 접수' : 'Submit request'}</h3><p>{isSubmitting ? (lang === 'ko' ? '신청을 보내고 있습니다.' : 'Sending your request.') : (lang === 'ko' ? '제출 후 접수 결과를 확인할 수 있습니다.' : 'Your result appears after submission.')}</p></div></li>
    </ol>
    <p className={styles.statusNote}>{lang === 'ko' ? '신청 접수는 입장 확정을 뜻하지 않습니다.' : 'Submitting a request does not confirm admission.'}</p>
  </aside>;
}
