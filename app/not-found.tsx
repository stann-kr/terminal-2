'use client';
import styles from './RecoveryPage.module.css';

// Keep the fallback independent of provider-backed client components during prerender.
export const dynamic = 'force-dynamic';
export default function NotFound() {
  return <main id="main-content" tabIndex={-1} className={styles.page}>
    <div className={styles.frame}>
      <p className={styles.header}>TERMINAL / PAGE_NOT_FOUND</p>
      <div className={styles.body}>
        <span aria-hidden="true" className={styles.code}>404</span>
        <h1>페이지를 찾을 수 없습니다.</h1>
        <p>주소를 확인하거나 이벤트 목록에서 다시 찾아보세요.</p>
        <div className={styles.actions}><a href="/gate">이벤트 보기 <span aria-hidden="true">↗</span></a><a href="/home">홈으로</a></div>
      </div>
    </div>
  </main>;
}
