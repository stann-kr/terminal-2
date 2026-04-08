# 변경 이력 (Change Log)

프로젝트에 적용된 주요 변경 사항을 기록함. Git 커밋 내역 외에도 의미 있는 아키텍처 변화 등을 요약함.

## [2026-04-08] 초기 프로젝트 셋팅 (AI 개발 환경 및 Docker)
* **환경 셋팅:** Apple Silicon에 최적화된 Docker 컨테이너 셋팅 (Node 20 기반) 완료.
* **DB 셋팅 준비:** Cloudflare D1 연동을 위한 Drizzle ORM 도입 계획, `wrangler.toml` 기초 설정.
* **애니메이션/레이아웃:** `@chenglou/pretext` 라이브러리를 도입하여 리플로우 없는 빠른 텍스트 애니메이션 및 페이지 전환 기반 마련.
* **문서화 구조:** 전역 지침에 따라 `.docs/` 폴더 구성 및 AI 도구(Claude Code, Antigravity Gemini) 통합 지침용 스킬 파일 추가 완료.
* **페이지 전환 시각화 (Cipher / Decode):** 각 컴포넌트에 적용되어 있던 기존의 페이드 애니메이션을 제거하고, `use-scramble` 기반의 `<DecodeText>` 인라인 컴포넌트를 설계/적용하여 텍스트 복호화(Ciper/Decode) 시각 연출 및 레이아웃 유지 구현.

## [2026-04-08] DecodeText 버그 수정 및 페이지 전환 안정화

* **DecodeText 구조 리팩토링:** `measureRef` 분리(`scrambleRef` 독립), `scrambleOnUpdate=false` 초기 애니메이션 복원, `delay` prop 구현(stagger 효과 정상화), `className` 이중 적용 제거.
* **홈/게이트 카운트다운 수정:** border·padding을 부모 div로 이동하여 이중 적용 해소, `display:flex` 숫자 중앙 정렬 복원.
* **페이지 전환 스크롤 점프 해결:** `PageTransition.tsx`에 pathname 변경 시 `window.scrollTo({ top:0, behavior:'instant' })` 추가.
* **Lineup 이중 효과 제거:** `containerVariants`에서 `opacity 0→1` fade 제거, 각 `DecodeText`의 decode 효과만 유지.
* **의존성 추가:** `use-scramble` 패키지 설치 및 Docker 이미지 리빌드 완료.

## [2026-04-09] 레이아웃 버그 수정 및 UX 개선

* **`[]` 제목 위아래 배치 버그 수정 (`DirectoryLink.tsx`):** `DecodeText` 외부 `<div>`(block 요소)가 `[`와 `]` 사이에 삽입되어 위아래 배치되던 문제 해결. `[${label}]`을 text 내부로 통합하여 한 줄 렌더링.
* **Status 페이지 데스크탑 레이아웃 수정 (`status/page.tsx`):** `grid-cols-12` col-span 재분배(name 3→2, sector 4→3, status 1→3)로 ONLINE/STANDBY 텍스트 overflow 해소. status 셀을 `flex items-center gap-1` 구조로 변경하여 `●` 아이콘과 텍스트 수평 정렬.
* **모바일 가로 스크롤 방지 (`PageLayout.tsx`):** 루트 div에 `overflow-x-hidden` 추가. 좌우 패딩 `px-4 sm:px-6` 반응형 적용.
* **PageLayout 상하 패딩 균형 조정 (`PageLayout.tsx`):** 모바일 `pt-14 pb-14`, 데스크탑 `pt-20 pb-20`으로 통일.
* **홈 로고 박스 라인 모바일 대응 (`home/page.tsx`):** `╔══╗`/`╚══╝` 박스 문자를 모바일에서 `text-[8px]`로 축소 표시, `overflow-hidden` 클리핑 제거로 전체 박스 라인 노출.
* **TERMINAL 로고 letter-spacing 반응형 (`home/page.tsx`):** `tracking-[0.3em]` 고정 → `tracking-[0.15em] sm:tracking-[0.3em]`으로 모바일 overflow 방지.
* **BootSequence 진입 방식 변경 (`BootSequence.tsx`):** 부팅 완료 후 자동 진입 및 "PRESS ANY KEY" 텍스트 제거. `[ ENTER TERMINAL ]` 버튼으로 대체, 호버 글로우 효과 적용.

## [2026-04-08] Cipher 애니메이션 전역 적용 및 성능 최적화
* **전역 일관성 확보:** `Home`, `About`, `Gate`, `Lineup`, `Status`, `Transmit` 등 모든 주요 페이지의 정적/동적 텍스트를 `<DecodeText>`로 전면 전환하여 일관된 터미널 Cipher 미학 수립.
* **동적 텍스트 최적화:** 카운트다운 숫자가 매초 뒤섞이는 현상을 방지하기 위해 `scrambleOnUpdate` 프롭을 도입하고 적용 완료.
* **레이아웃 안정성 강화:** `DecodeText` 컴포넌트 마운트 시의 컨테이너 높이 계산 로직을 고도화하고 CSS 트랜지션을 추가하여 레이아웃 점프 및 스크롤 튐 현상을 근본적으로 해결.
* **불필요한 애니메이션 제거:** 각 컴포넌트에 파편화되어 있던 `Framer Motion` 기반의 페이드 효과를 제거하여 단순하고 명확한 복호화 전환 아키텍처 완성.
