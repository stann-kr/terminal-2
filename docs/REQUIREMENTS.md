# 프로젝트 세부 명세서 (Requirements)

이 문서는 프로젝트의 전체 기술 명세서 및 기능 요구 사항을 문서화함. 개발 시 이 문서를 최우선으로 참고하여 아키텍처 및 상태 관리를 일관성 있게 유지함.

## 1. 개요
* 프로젝트 명: terminal-2 / STANN OS LIVE
* 표면 역할: LIVE (`TM-02`) — 공개 URL `https://terminal.stann.kr`
* 주요 기술 스택: Next.js 16 App Router, React 19, Tailwind CSS, Docker (Apple Silicon), Cloudflare OpenNext Worker, Cloudflare D1, Drizzle ORM, TanStack Query
* 디자인 시스템: STANN OS 공통 토큰 + terminal-2 이벤트 스킨, 모던 터미널 인터페이스 / 레트로 퓨처리즘 스타일 적용

## 2. 주요 아키텍처 원칙
* **Apple Silicon 최적화 Docker 환경:** Docker는 로컬/dev 또는 prod-like smoke 용도로 사용한다. 공개 배포의 정본 artifact는 `@opennextjs/cloudflare` Worker bundle이다.
* **DB 연동:** Cloudflare D1 바인딩(`DB`) 및 Drizzle ORM을 활용한 데이터 관리.
* **텍스트 렌더링:** 최종 문자열을 서버 HTML에 먼저 렌더링하고, 브라우저 레이아웃을 정본으로 유지한 채 대표 제목과 비필수 boot/sleep 화면에만 cipher를 점진적으로 적용함.
* **UI/컴포넌트 설계:** 의미 텍스트와 상태는 서버 HTML부터 읽을 수 있어야 하며, cipher/WebGL은 콘텐츠를 대체하지 않는 점진적 향상으로만 사용한다.
* **접근성:** route마다 하나의 `main`, skip link, 고유 title/h1을 제공하고 폼 label·오류·focus·reduced-motion 계약을 유지한다.

## 3. 기능 요구 사항
* HOME: `/`·`/home`에서 LIVE→가까운 예정→최근 지난 이벤트 순서로 정보·원본 포스터·주요 행동을 제공한다. Boot/Sleep은 `/?experience=terminal` 선택형 체험이다.
* GATE: LIVE/upcoming/archive 정보와 동일 행사 Lineup 연결을 제공하며 서버의 실제 신청 대상·기간에 해당할 때만 신청 CTA를 표시한다.
* REQUEST: 화면 eventId와 서버 신청 대상을 일치 검증하고 코드·기간·정원 정책을 적용한다. 대상 변경 시 입력을 보존한 채 행사 재확인·코드 재검증을 요구한다. 접수는 입장 확정을 뜻하지 않는다.
* LINEUP: 유효 event URL을 우선하여 아티스트·시간·정적 상태를 표시한다. 설명 펼침은 키보드·접근성 상태와 DOM 수명을 함께 유지한다.
* STATUS: 이벤트 레지스트리 기반 세션 요약과 정적 노드 시각화 표시. 실제 telemetry 또는 realtime 상태로 표현하지 않는다.
* TRANSMIT: 공개 별칭·메시지 게시를 사전에 안내하고 idempotency key를 유지한다. 전송 중 수정한 새 초안은 이전 요청 성공으로 지우지 않는다.
* SIGNAL: 이벤트 신호 수신 채널 등록.
* LINK: STANN OS HUB / ARCHIVE / LIVE 및 외부 채널 연결.

## 4. 검증 및 배포 게이트
* 최소 로컬 검증: `npm ci`, `npm audit --omit=dev`, `npm run db:check-history`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run smoke:http`, `npm run build:worker`, Worker HTTP smoke, `npm run test:d1`, production environment Wrangler dry-run.
* Cloudflare Workers Builds가 유일한 자동 배포 주체다. `dev`는 고정 development Worker, `main`은 production Worker를 대상으로 하며 GitHub Actions는 validation만 수행한다.
* Worker code deploy는 D1 migration, secret, binding, route와 분리한다. production deploy와 모든 remote D1 migration은 별도 승인·검증 대상이다.
* migration history는 `0000`부터 연속·고유한 SQL, SQL tag와 1:1인 journal, SQL과 1:1인 snapshot 및 유효한 `id`/`prevId` chain, exact path + SHA-256 lock을 유지한다. 기존 SQL·snapshot overwrite/delete와 wrapper 밖의 추가를 금지하고, 신규 migration은 `npm run db:generate -- --name <safe_name>`만 사용한다.
* development와 production remote migration은 각각 명시적 environment로 list/apply/사후 검증하며, 한 환경의 적용 상태를 다른 환경의 증거로 간주하지 않는다.
* 공개 API는 정확한 JSON media type, streaming byte limit, runtime DTO, no-store 민감 응답과 PII-safe log 계약을 유지한다.
* rate-limit/Turnstile 검증 인터페이스는 로컬에서 테스트하지만, 실제 binding·secret과 Signal verification/unsubscribe/retention 운영이 없으면 public-release ready가 아니다.
* push, PR, production deploy, remote D1 migration과 production secret/config/data는 별도 승인 대상이다.

## 5. 데이터베이스 구조 (Schema)
* **Flexible JSON Model:** `events`, `artists` 테이블은 고정 컬럼 대신 `data` JSON 컬럼을 활용하여 데이터 속성 변경에 유연하게 대응함.
* **Core Tables:**
    * `events`: 이벤트 정보 (세션, 일정, 장소, 다국어 초대 메시지 등).
    * `artists`: 출연진 정보 (프로필, 소개글 등).
    * `access_requests`: 입장 신청 내역 (개인정보, 인스타그램 ID 등).
    * `transmit_logs`: 메시지 전송 로그. 신규 입력과 공개 응답은 핸들러·메시지·시각만 사용하며 레거시 디바이스 식별 컬럼은 공개하지 않음. repository history는 현재 `0000`–`0009`의 10개 migration이며, `0009` 적용 후 `created_at`은 ISO timestamp `TEXT NOT NULL`이다.
    * `signal`: 이벤트 소식 구독 채널. 현재 저장 계약만 존재하며 ownership verification·unsubscribe·retention lifecycle은 release gate다.
