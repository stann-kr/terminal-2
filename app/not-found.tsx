// The root terminal frame supplies the single main landmark.
export default function NotFound() {
  return <section className="tm-empty">
    <p className="tm-eyebrow">TERMINAL / PAGE_NOT_FOUND</p>
    <h1>페이지를 찾을 수 없습니다.</h1>
    <p>주소를 확인하거나 이벤트 목록에서 다시 찾아보세요.</p>
    <div className="tm-action-group"><a className="tm-action" href="/gate">이벤트 보기</a><a className="tm-action tm-action-secondary" href="/home">홈으로</a></div>
  </section>;
}
