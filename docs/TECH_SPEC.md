# 기술 명세서 (Technical Specification)

본 문서는 프로젝트의 핵심 아키텍처, 커스텀 컴포넌트 설계, 운영 및 검증 계약을 기술한다.

## 1. 전역 아키텍처 및 렌더링

- Next.js App Router와 React, OpenNext Cloudflare Worker를 사용한다. 제품 route와 공개 API는 `app/`이 맡는다.
- `features/terminal/`이 Aspen 화면을 제공한다. `shell/`은 고정 헤더·디렉터리·footer와 단일 `main#main-content`, `events/`는 Home/Gate/행사 조회, `lineup/`은 공개 명단과 프로필, `info/`는 행사 기록·소개·채널, `entry/`는 선택형 부팅·IDLE을 소유한다.
- `app/gate/request`, `app/signal`, `app/transmit`의 기존 hook이 제출·검증·초안·I/O를 계속 소유한다. 공통 폼 스타일은 `features/terminal/forms`, 방명록 스타일은 `features/terminal/transmit`에 둔다.
- `mockups/aspen-terminal/`은 독립 참고 목업이다. 제품 번들은 목업 App, 행사 스냅샷, 검토 메뉴, 체험 코드나 가정 성공 상태를 import하지 않는다.
- `archives/classic/source.tar.gz`는 이전 제품 전체의 고정 snapshot이다. [아카이브 실행 안내](../archives/classic/README.md)의 명령으로 별도 의존성·로컬 D1에서 실행한다.

## 2. 시각 시스템과 접근성

- `features/terminal/base.css`가 문서 기본 스타일, 로컬 폰트와 `--tm-*` 토큰을 소유한다. 전경 `#d0d0d0`, 배경 `#030303`, 강조 `#ff5d00`을 사용한다. 각 화면의 격자·반응형·상태 스타일은 해당 capability에 둔다.
- Pixie는 TERMINAL 브랜드 단어에만 사용한다. 제목과 본문에는 Orbit, 숫자·메타·입력에는 고정폭 서체를 사용한다. `app/stann-os.css`와 token verifier는 유지한다.
- 화면 외곽 테두리 없이 큰 콘텐츠 구획으로 나눈다. 구획 안의 정보는 제목·간격·자연 너비로 구분한다. 기본 행동은 오렌지 면, 보조 이동은 선 또는 텍스트 링크다.
- 실제 링크는 Next Link와 URL query를 사용한다. 이벤트 변경 시 `artist`와 기존 `view`를 함께 해제하며 다른 query는 보존한다. 명시한 event/artist가 없으면 다른 대상을 조용히 대신 선택하지 않는다.
- route마다 main·skip link·고유 title과 의미 있는 h1을 제공한다. 입력 label과 error ID를 연결하고, 첫 오류·프로필·접수 결과로 focus를 옮긴다. 프로필의 명단 복귀와 메뉴 Escape는 원래 조작 대상으로 돌아간다.

## 3. CRT와 출력 모션

`features/terminal/motion/`의 GSAP 및 `useGSAP`가 장식 모션을 소유한다. 기존 목업의 타이밍과 공간을 유지하며 route·focus·입력·서버 결과는 모션 완료를 기다리지 않는다.

- `TerminalText`는 원문을 의미·레이아웃의 기준으로 두고 aria-hidden 출력 레이어만 갱신한다.
- `useReadoutMotion`은 브라우저의 실제 줄 경계를 읽는다. 구획 65ms, 본문 한 줄 45ms, 제목 문자 12ms의 동일한 간격을 적용한다. 내용이 많으면 완료까지 더 오래 걸린다.
- 최종 배치 공간을 유지한 채 구획·입력칸을 표시하고 그 안의 텍스트를 출력한다. 호버 이동, 흐르는 경계선과 화면 슬라이드는 없다.
- 클릭·키보드·휠·입력·focus·resize·폰트 변경은 남은 출력을 완료한다. 폼의 변경 모션은 오류·상태·결과에 한정해 작성 중인 필드를 다시 숨기지 않는다.
- CRT의 고정 raster·grain·유리 음영·텍스트 발광은 헤더부터 footer까지 같은 표면에 놓인다. 9.7초 주기의 약한 배경 발광은 입력 focus 때 멈춘다.
- CRT OFF, reduced-motion, 고대비/강제 색상, 숨겨진 탭, 데이터 절약에서는 장식 모션을 해제한다. 정책 복원만으로 진입 연출을 반복하지 않는다. 화면 이탈 시 timeline·observer·listener를 정리한다.
- Home 카운트다운은 실제 행사의 KST 시작 시각을 사용하고 초 단위로 갱신한다. 숨겨진 탭에서는 정지하고 복귀 시 현재 시각으로 계산한다. 잘못된 시각은 표시하지 않는다.

## 4. 화면별 동작

- Home은 LIVE → 가장 가까운 예정 → 최근 지난 행사 순서로 선택한다. 행사명·회차 또는 포스터·카운트다운·소개·일시/장소·행동을 같은 격자에 배치한다. 포스터 오류는 회차 타이포그래피로 복원한다.
- Gate는 행사 선택과 정보·소개·공개 라인업을 제공한다. 실제 서버 신청 대상과 기간에 해당하는 행사에만 신청 링크를 표시한다. 기존 `view=archive` URL도 해석한다.
- Lineup은 첫 공개 아티스트를 기본 소개로 삼으며 `artist` query가 있으면 소속·공개 상태를 확인한다. 모바일에서는 명단과 소개가 같은 읽기 흐름에 놓인다.
- Request/Signal은 설명과 입력의 두 영역, 모바일 한 열을 사용한다. 신청은 eventId·코드·동의 검증을 유지하며 서버 접수 성공에만 완료 화면을 표시한다. 대상 변경은 초안을 보존하고 새 행사 확인·코드 재검증을 요구한다. 소식 신청 완료는 메일 발송 완료를 의미하지 않는다.
- Transmit는 작성과 게시 기록을 나눈다. 서버의 실제 pagination을 사용하고 후속 조회 실패에도 이전 페이지로 돌아갈 수 있다. 입력 중 수정한 새 초안과 재시도의 idempotency key를 보존한다. 공개 시각은 KST로 표시한다.
- Status는 연도별 실제 행사 기록을 표시한다. 조회 실패와 빈 데이터는 구분한다. About/Link는 기존 소개와 공식 URL을 사용한다.
- `/entry`는 부팅·IDLE을 제공하며 `/?experience=terminal`은 이 경로로 연결한다. 최초 부팅·방문 후 IDLE, 자동 언어 감지·명시적 언어 선택, 건너뛰기와 한 번의 입장 처리를 지원한다. WebGL은 새 제품 화면에서 사용하지 않는다.
- 404는 공통 main 안에서 복구 링크를 제공한다. 전역 오류는 root provider/CSS에 의존하지 않는 독립 HTML과 복구 버튼을 사용하고 오류 상세는 노출하지 않는다.

## 5. 로컬 개발과 검증

- 기본 개발 서버는 `npm run dev`, port 3005다. 아카이브는 `npm run archive:dev -- --port 3006`으로 동시에 실행할 수 있다.
- 공개 API와 기존 capability test를 유지한다. UI 회귀는 실제 route, field, consent, focus, query, receipt, retry와 idempotency를 검증한다. CSS 비교·unit test·HTTP 응답은 실제 browser 시각 승인과 구분한다.
- `npm run build:worker:production`은 token 검사와 Next 빌드를 포함한 production OpenNext bundle을 만든다. `npm run cf:preview:production`은 로컬 Worker runtime이다. 명시적 원격 배포·DB 변경과는 구분한다.
- snapshot 아카이브는 package lock·API·migration·patch·asset을 함께 보존하며, 원본 archive SHA-256을 실행 전에 확인한다. runner는 아카이브 자체 local development DB만 준비하고 운영 데이터는 복사하지 않는다.

## 6. 데이터 모델 및 DB 아키텍처 (Flexible JSON Schema)

Cloudflare D1의 제약 사항과 개발 생산성을 고려하여, 핵심 비즈니스 로직이 담긴 테이블(`events`, `artists`)은 고정된 컬럼 대신 유연한 JSON 구조를 채택함.

### 6.1 `events` 테이블 설계
- **`id` (PK):** 이벤트 식별자 (예: `TRM-02`)
- **`data` (JSON):** 이벤트의 모든 메타데이터를 포함하는 JSON 문자열.
  - 주요 필드: `session`, `subtitle`, `date`, `time`, `venue`, `status`, `invitationLines` (다국어 지원 객체) 등.
  - 인포 패널 필드: `description: { en: string; ko: string }` (소개글), `posterUrl: string` (R2 이미지 URL) — optional, `EventSummary`가 Home/Gate에서 원본 이미지 비율과 실제 소개를 표시한다. 포스터가 없으면 행사 정보만으로 구성한다.
  - 장점: 새로운 속성 추가 시 DDL 마이그레이션 없이 애플리케이션 레벨의 타입 업데이트만으로 대응 가능.

### 6.2 `artists` 테이블 설계
- **`id` (PK):** 아티스트 식별자 (예: `02-A`)
- **`event_id` (FK):** `events.id` 참조 (Cascade On Delete)
- **`data` (JSON):** 아티스트 정보.
  - 주요 필드: `name`, `origin`, `status`, `description` (다국어 지원 객체) 등.

`lib/events/lifecycle.ts`는 strict KST calendar/time 파싱, 유효 URL 우선 선택과 LIVE→가까운 UPCOMING→최근 ARCHIVED 기본값을 소유한다. `useEventClock`은 신청창·시작 경계와 visibility 복귀 때만 재계산한다.

### 6.3 `access_requests` 및 `transmit_logs`
- 이들은 트랜잭션 성격이 강하므로 전통적인 관계형 컬럼 구조를 유지하여 쿼리 성능과 데이터 무결성을 확보함.
- Gate의 payload·event/access-code·request-window rule은 `lib/gate/createAccessRequest.ts`와 `requestPolicy.ts`, raw SQL과 atomic D1 batch는 `d1AccessRequestRepository.ts`, HTTP transport와 response mapping은 API route가 각각 소유한다.
- Signal의 공통 입력 규칙·D1 구독 statement·생성 orchestration은 `lib/signal/`, Transmit의 공개 contract·입력/domain·D1 repository·client는 `lib/transmit/`이 소유하며 각 API route는 transport와 abuse/response mapping만 담당한다.
- 게스트 신청은 기존 `(event_id, email)` 고유 인덱스와 D1 배치 안의 조건부 INSERT를 함께 사용해 중복 이메일·아티스트별 정원·선택적 마케팅 등록을 한 경계에서 판정한다.
- Gate Request와 Signal의 신규·중복 성공은 모두 `200 { ok: true }`와 `no-store`를 반환해 등록 여부를 노출하지 않는다.
- 전송 로그의 신규 입력과 공개 DTO는 디바이스 식별자를 수집하거나 노출하지 않는다. 기존 nullable 컬럼은 호환성을 위해 유지한다.
- repository는 전환 기간의 integer/nullable `transmit_logs.created_at`을 읽을 수 있지만, 10번째 migration인 `0009_normalize_transmit_created_at.sql`은 지원되는 레거시 값을 ISO 문자열로 변환하고 물리 컬럼을 `TEXT NOT NULL`로 재구성한다. development와 production remote 적용은 서로 독립된 승인·검증 단계다.
- 이벤트·아티스트 JSON은 public runtime decoder를 통과한 필드만 DTO로 반환하며 access code, guest limit과 저장 전용 필드는 노출하지 않는다.
- 게스트 코드가 설정된 아티스트의 `guestLimit`은 bounded integer 필수값이다. 누락·오염 시 무제한으로 해석하지 않고 availability 오류로 닫는다.
- Transmit POST는 16–128자의 `Idempotency-Key`를 요구하며 같은 key/payload 재시도는 기존 공개 DTO를 반환한다.

## 7. 다국어(i18n) 아키텍처

### 구조
- `lib/i18n.ts` — ko/en 번역 쌍 전체 정의. 섹션별 객체로 분리 (common, home, gate, request, lineup, status, transmit, link, dirDesc, manifesto)
- `lib/langContext.tsx` — `LangContext` + `LangProvider` + `useLang()` + `useT()`

### useT() 훅 사용 패턴
```tsx
const t = useT();            // 현재 언어의 번역 객체 반환
t.home.nextEntry             // 홈 페이지 텍스트
t.common.signalUnstable      // 공통 에러 메시지
t.dirDesc.gate               // 디렉토리 설명
```

### 신규 번역 추가 방법
1. `lib/i18n.ts` 해당 섹션에 ko/en 키-값 쌍 동시 추가
2. `Translations` 타입에 자동 반영 (타입 추론)
3. 페이지에서 `const t = useT()` 후 `t.<섹션>.<키>` 로 접근

### 언어 전환 동작
- `localStorage` 기반으로 새로고침 후에도 언어 유지
- `document.documentElement.lang` 속성 동기화

---

## 8. 서버 상태 관리 (TanStack Query)

### 설정
- `providers/query-provider.tsx` — 앱 루트(`app/layout.tsx`)에 `<QueryProvider>` 래핑
- `staleTime: 5분` — 캐시 신선도 유지, 재페칭 억제
- `gcTime: 30분` — 컴포넌트 언마운트 후 메모리 유지 (스와이프 백 복귀 시 로딩 없이 즉시 반환)
- `retry: 1` — 실패 시 1회 자동 재시도

### Query Key 팩토리 패턴
- `lib/events/client.ts` — `eventKeys.list()` → home·lineup·gate·status가 동일 키를 참조해 캐시 공유
- `lib/transmit/client.ts` — `transmitKeys.list(page)` → 페이지 번호별 독립 캐시

### 사용 패턴
```tsx
// 조회
const { data: events = [], isLoading, isError } = useQuery({
  queryKey: eventKeys.list(),
  queryFn: fetchEvents,
});

// 뮤테이션 + 캐시 무효화
const { mutate } = useMutation({
  mutationFn: postTransmitLog,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: transmitKeys.all }),
});
```

### 적용 대상 (API 호출 있는 페이지만)
- `app/home/page.tsx`, `app/lineup/page.tsx`, `app/gate/page.tsx`, `app/status/page.tsx`, `app/transmit/page.tsx`
- `app/link/page.tsx` — 정적 데이터이므로 미적용

---

## 9. 운영 주의사항

- **빌드 환경:** `package.json`의 build 스크립트가 `cross-env NODE_ENV=production next build`로 production 모드를 고정한다. 이 보장은 `_global-error`와 `_not-found` 프리렌더링에 필요하다.
- **Docker 패키지 설치:** `docker-compose.yml`의 `node_modules`는 anonymous volume이다. Docker 환경의 패키지 변경은 실행 중인 컨테이너에서 수행하고 이미지 재빌드 여부를 함께 판단한다.
- **공개 API 보호:** `PUBLIC_RATE_LIMITER`와 Turnstile Siteverify validator의 로컬 계약은 구현돼 있다. 실제 Cloudflare binding/secret과 client token flow가 연결되기 전에는 public-release ready로 판정하지 않는다.
- **Migration history:** repository history는 `0000`부터 `0009`까지 10개다. `scripts/check-migration-history.mjs`는 연속·고유 SQL prefix, journal tag 1:1, snapshot 1:1과 `id`/`prevId` chain, lock의 exact path + SHA-256을 검증한다. 기존 SQL·snapshot은 append-only이며 새 migration은 명시적 safe `--name`을 받는 `npm run db:generate -- --name <name>`만 사용한다. wrapper는 임시 디렉터리에서 생성 결과를 검사해 journal + 다음 SQL + 다음 snapshot만 반영하고 lock을 원자적으로 갱신한다. raw `drizzle-kit generate`는 허용하지 않는다.
- **검증 계층:** Vitest는 Node와 jsdom project를 분리한다. `scripts/http-smoke.mjs`는 route title/main/SSR text/cache/WebGL initial graph를, `scripts/verify-local-d1.mjs`는 빈 임시 D1에 10개 Wrangler migration, FK/index 컬럼, Gate·Signal 조건부 insert와 Transmit idempotency/ISO timestamp 정렬을 검증한다.
- **CI와 배포:** `.github/workflows/validate.yml`은 secret 없이 install/audit/migration-history/test/lint/typecheck/build/Next·Worker smoke/D1/production-env dry-run을 실행한다. Cloudflare Workers Builds가 `dev`의 `terminal-2-dev`와 `main`의 `terminal-2`를 각각 자동 배포한다. 두 remote Worker는 운영 D1 `terminal-db`와 migration 이력을 공유하며 dev에서 신청·Signal·Transmit을 제출하면 운영 데이터에 반영된다. Local development와 CI는 local D1을 사용하고 remote smoke는 조회로 검증한다. D1 migration·secret·binding·route 변경은 별도 범위이며 승인된 shared DB migration은 한 번 적용한 뒤 검증한다.
