# 기술 명세서 (Technical Specification)

본 문서는 프로젝트의 핵심 아키텍처, 커스텀 컴포넌트 설계, 운영 및 검증 계약을 기술한다.

## 1. 전역 아키텍처 및 렌더링 원칙

- **프레임워크:** Next.js 16.2.11 (App Router 기반), React 19
- **런타임 및 개발 환경:** 공개 배포는 OpenNext 기반 Cloudflare Worker bundle을 사용한다. 로컬 개발은 npm 스크립트를 기본으로 하며 Docker 환경도 지원한다.
- **UI/UX 미학(Aesthetics):** 검정 바탕·오렌지 제목줄·반전 디렉터리와 각진 패널을 사용한다. 화면별 작업 영역은 문서 스크롤 안에서 늘어나며 모바일에서는 읽기 순서에 맞게 단일 열로 전환한다. 일반 Home은 ASCII 표현, WebGL ambient는 선택형 터미널 체험에서만 조건부로 로드한다.
- **명명 규칙 및 코드 스타일:** 명확한 시맨틱 네이밍, 하드 코딩 지양. CSS 스타일링 시 Tailwind를 기본으로 하되, 복잡한 인라인 동적 속성은 `style` 객체로 관리함.

## 2. 타이포그래피 시스템

본문·입력은 system sans 16px, 보조 문구와 조작 label은 14px, 메타는 12px를 기본으로 한다. Pixie는 브랜드, 로드된 JetBrains Mono는 제목·탐색·버튼·날짜·코드에 사용한다. `app/globals.css`의 terminal 역할 토큰과 capability별 CSS Modules가 표현을 소유하며 `app/stann-os.css` 정본은 보존한다. 장식 번호·브랜드 메타는 의미 label과 분리한다.

| 토큰 | 값 |
|---|---|
| `text-micro`, `text-caption` | 12px |
| `text-small` | 14px |
| `text-body`, `text-heading` | 16px |
| `text-h2` | 20px |
| `text-h1` | 32px |
| `text-title`, `text-hero` | 48px |
| `text-display` | 96px |

`BodyText`는 모든 폭에서 16px plain text다. 공통 `PageHeader`는 cipher를 명시적으로 요청할 때만 연출하며 보통 제목을 즉시 표시한다.

- 페이지 제목 위에는 module label을, 디렉터리에는 번호·화면명·이동 표식을 표시한다. 모바일에서는 설명과 시간을 별도 행으로 배치한다.
- 주요 버튼과 언어 선택은 반전 표시하며, 공통 버튼·라벨은 14px와 최소 44px 높이를 유지한다. 현재 탐색 위치는 `aria-current`로 표시한다.
- 행사 요약은 포스터와 정보의 상단을 맞추고 날짜·장소를 라벨/값 열로 정렬한다. 포스터는 안정된 영역 안에 `object-fit: contain`으로 전체 이미지를 보여준다. 이미지가 없거나 로드에 실패하면 실제 행사 정보의 타이포 면으로 대체한다.

### FormField 컴포넌트 API (`components/ui/FormField.tsx`)

```tsx
// 폼 필드 래퍼
<FormField label="NAME:" htmlFor="name">
  <input id="name" name="name" className={`${inputClassBase} ${inputAccentClass.secondary}`} />
</FormField>

// accent 종류: secondary | tertiary | alert | warn | primary
```

- `FieldError`는 필드의 `aria-describedby` 대상과 alert semantics를 제공한다.
- `useFieldErrors`는 validation error의 첫 필드로 focus를 이동하며 Signal·Gate Request·Transmit가 같은 계약을 사용한다.
- 제목이 있는 `TerminalPanel`은 기본적으로 labelled `section`과 `h2`를 렌더링하고, 중첩 panel은 `headingLevel={3}`을 사용한다.

---

## 3. GSAP 터미널 모션과 `DecodeText`

GSAP 3.15.0과 `@gsap/react` 2.1.2를 사용한다. 콘텐츠와 조작은 즉시 제공하며 공통 헤더·메뉴·페이지 제목은 이동 시 진입 모션을 재생하지 않는다. Cipher는 선택형 터미널 체험에 사용한다.

### 3.1 통합 컴포넌트 `<DecodeText>` 및 `<TerminalText>` 분석

- **위치:** `components/DecodeText.tsx`, `components/ui/TerminalText.tsx`
- **핵심 역할:** 최종 문자열을 서버 HTML에 먼저 렌더링하고 안정적인 `aria-label`을 유지한 채 같은 DOM node의 시각 문자열에만 cipher를 적용한다.
- **시맨틱 추상화 (`TerminalText.tsx`):**
  - `TitleText`와 명시적으로 `cipher`를 켠 heading 외의 본문·라벨·메타·데이터는 plain semantic text로 렌더링한다.
  - `DecodeText` 직접 사용은 사용자 motion 정책을 따르는 비필수 boot/sleep 화면으로 제한한다.
  - 제공 컴포넌트: `TitleText` (히어로), `HeadingText` (섹션 제목), `SubtitleText` (부제), `BodyText` (본문), `LabelText` (시스템 라벨), `MetaText` (메타데이터), `DataText` (실시간 데이터).
- **주요 동적 속성 및 토큰화 (`lib/animationTokens.ts`):**
  - 각 시맨틱 컴포넌트는 `animationTokens.ts`에 정의된 프리셋을 참조하여 동작함.
  - `useMotionPolicy`는 reduced-motion, save-data, document visibility를 live 구독한다. 정책이 motion을 허용하지 않으면 장식 애니메이션을 해제하고 콘텐츠를 최종 상태로 복원한다.
  - 브랜드 디코드는 motion 정책 확인 후 제목별로 한 번 시작하고 완료 콜백도 한 번만 실행한다. 중간에 탭을 숨기면 최종 문자열로 끝내며 복귀할 때 다시 재생하지 않는다.
  - `ScrambleTextPlugin`은 DOM 대신 `textContent`만 가진 proxy를 애니메이션한다. 출력은 실제 요소의 `textContent`로 복사해 HTML처럼 보이는 문자열도 문자 그대로 유지한다. 완료 시 원문과 공백을 복원한다.
  - `use-scramble` 의존성과 보안 patch 검증은 기존 설치 계약으로 보존하지만, `DecodeText`의 재생은 GSAP이 소유한다.
- **레이아웃 보존 기술 (Layout Shift 방지):**
  - 최종 문자열을 실제 DOM child로 먼저 렌더링해 브라우저 레이아웃과 접근성 트리가 같은 내용을 사용한다.
  - 펼침 영역은 `AnimatedHeight`가 내부 콘텐츠의 실제 높이를 관찰하며, cipher는 최종 접근성 이름을 바꾸지 않는 시각적 향상으로만 실행한다.

### 3.2 페이지 구조 (PageLayout & Transition)

- **페이지 공통 래퍼:** `components/shell/PageLayout.tsx` 및 `components/shell/PageTransition.tsx`
- **동작 원리:** `PageLayout`은 `100dvh` 프레임에 헤더·메뉴·footer를 고정하고 남은 높이를 `main`의 내부 스크롤에 할당한다. pathname 이동 시 내부 스크롤은 상단으로 돌아가며 query 선택만 바뀔 때는 위치를 유지한다. `flush` 화면은 전체 너비를 사용하고 capability가 grid와 여백을 결정한다. 기본 event/reading/form 폭은 1600/1024/672px다. 데스크톱 상단 rail·메뉴는 약 32/41px이며 모바일·터치 컨트롤은 최소 44px 높이를 유지한다.
- **화면 전환:** `useTerminalScreen`은 고정된 상단 아래의 본문 표시 영역만 320ms·14단 주사 방식으로 다시 그린다. 상단·메뉴에는 진입 모션을 적용하지 않는다. 장식 mask는 pointer를 받지 않으며 본문 pointer/keyboard 조작이 들어오면 즉시 최종 화면을 표시한다. 같은 화면에서 탭 복귀나 모션 설정 변경으로 재생을 반복하지 않는다. SSR과 모션 비활성 상태에서는 mask가 투명하다.
- **CRT 질감:** `DisplayEffects`는 본문 스크롤 영역 위에 비네팅·유리 반사·주사선/형광체 격자·노이즈·16초 주사광을 겹친다. 텍스트에는 약한 형광체 번짐만 적용하고 내용이나 조작 영역을 변형하지 않는다. 장식은 `aria-hidden`·`pointer-events: none`이며 focus 중에는 약해지고 모바일은 강도를 낮춘다. 상단 CRT 토글은 `aria-pressed`를 제공하며 `useDisplayEffects`가 브라우저 저장소에 선택을 유지한다. 저장소 차단 시 같은 탭의 화면 이동 동안 선택을 유지한다. SSR은 효과를 숨긴 상태로 시작한다. reduced-motion·save-data·hidden에서는 GSAP 반복을 해제하고 정적 질감을 유지하며, 고대비/강제 색상에서는 오버레이와 글자 번짐을 숨긴다.
- `AnimatedHeight`는 초기 열린 내용을 서버 HTML에서 숨기지 않고, 닫힌 내용은 `aria-hidden`·`inert`로 제외한다. 기본 펼침 180ms·닫기 126ms이며, 새 요청은 현재 높이에서 반전한다. 내부 글자를 이동시키지 않으며 ResizeObserver로 변경된 내용 높이를 추적하고 reduced-motion에서는 즉시 최종 상태를 표시한다.
- **landmark:** header·navigation·footer와 분리된 `main#main-content`가 전역 skip link의 목적지가 된다. 독립적인 체험·복구 화면은 자체 main을 가진다.
- **탐색:** GATE·LINEUP·GUEST_REQ·STATUS·TRANSMIT·SIGNAL·ABOUT의 7개 디렉터리를 제공한다. `/gate/request`는 GUEST_REQ만 현재 메뉴로 표시한다. 모바일 보조 메뉴는 헤더 아래에서 펼쳐지고 높이가 부족하면 메뉴 내부가 스크롤된다. Escape로 닫으면 메뉴 버튼으로 focus가 돌아간다.

### 3.3 모션 소유권과 입력 반응

| 영역 | 연출 | 소유 위치 |
|---|---|---|
| 디렉터리 전환 | 고정된 본문 디스플레이 안에서 320ms 주사선과 화면 재표시 | `components/shell/useTerminalScreen.ts` |
| 디스플레이 질감 | 정적 유리·래스터·비네팅, 선택 가능한 미세 노이즈와 16초 주사광 | `components/shell/DisplayEffects.tsx`, `useDisplayEffects.ts` |
| Home 시간 표시 | 현재 행사의 KST 시작 시각 기준 T- 카운트다운 / T+ 경과 시간, 초 단위 갱신 | `app/home/HomeMasthead.tsx`, `components/events/CountdownBlock.tsx` |
| 행사 요약 | 정보 위치 고정, 행사 정보 280ms 재표시, 포스터 550ms 스캔, 내부 스크롤 진행선 | `components/events/useEventSummaryMotion.ts` |
| 버튼·메뉴 | 텍스트 고정, pointer 선택면 160ms 4단 스캔, keyboard focus 즉시 표시 | `components/ui/useControlMotion.ts` |
| 디렉터리·라인업 | 목록 즉시 표시, 선택과 반전으로 현재 대상 강조 | 해당 row component |
| 아티스트 프로필 | 선택한 프로필만 280ms 재표시, 정적 파형 위 스캔과 경계선, 반복 재생 없음 | `app/lineup/ArtistProfile.tsx` |
| 신청 접수 결과 | 서버 성공 뒤 결과 heading focus와 200ms 경계선 | `app/gate/request/RequestReceipt.tsx` |
| 공통 제목·panel | 제목 즉시 표시, panel 경계선 180ms 6단 스캔 | `PageHeader`, `TerminalPanel` |
| 현재 위치·전송 중 | footer 커서와 실제 pending 상태의 block 커서만 점멸 | `PageLayout`, `SubmitButton` |

- [공식 React 연동](https://gsap.com/resources/React/)의 `useGSAP` scope와 cleanup을 사용한다. 비동기 ResizeObserver에서 만드는 tween도 context에 포함한다.
- [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)는 가장 가까운 `data-scroll-region`을 scroller로 사용한다. 본문의 native 스크롤과 모션 위치를 일치시킨다. 포스터와 글자에는 pointer 추적·3D 기울기를 적용하지 않는다.
- 버튼 hover timeline은 재생·역재생으로 재사용하며 키보드 focus는 선택된 최종 상태를 즉시 표시한다. 조작 영역·글자·화살표의 위치는 고정한다. 실제 전송 중일 때만 `aria-busy`와 block 커서를 표시하고 artificial delay를 추가하지 않는다. reduced-motion·save-data·hidden 정책은 scan과 커서 점멸도 해제한다.
- `revealTerminalReadout`은 행사·프로필 내용의 재표시와 cleanup을 공유한다. 영역에 focus나 pointer 입력이 오면 clipping을 즉시 해제하므로 읽기·조작을 위해 연출 완료를 기다릴 필요가 없다.
- 콘텐츠 높이·이미지 로딩 뒤의 scroll 위치 재계산은 `ScrollTrigger.refresh(true)`로 묶는다. 화면 이탈 시 scene의 trigger, timeline, observer와 event listener를 정리한다.
- 동일 요소의 transform·opacity를 GSAP과 CSS/Framer Motion이 동시에 제어하지 않는다. 기존 Boot/Sleep 상태 전환과 Transmit 상태 표현의 Framer Motion은 별도 owner로 유지한다.

### 3.4 화면별 작업 영역과 상태

- Home/Gate는 현재 행사와 원본 포스터를 연결한다. Home 상단의 시간 표시줄은 동일 행사의 시작 시각을 사용하며 데이터가 없거나 시각이 잘못된 경우에는 표시하지 않는다. Gate의 신청 행동은 기존 행사 선택·신청 기간 정책을 따르며 코드 입력은 신청 화면 한 곳에서 관리한다.
- Request는 입력과 실제 코드 상태를 나눠 보여준다. 마감 상태에서는 신청 단계 패널을 표시하지 않으며, 성공 결과는 같은 URL의 제출된 행사 snapshot에 귀속한다. 코드 확인·신청 접수·입장 확정은 서로 다른 상태다.
- Lineup은 명단과 프로필로 구성한다. `/lineup?event=…&artist=…`의 아티스트는 선택 행사에 속해야 한다. 행사 변경은 artist 해제와 함께 한 번의 history 갱신으로 처리한다. 모바일 선택은 프로필 제목으로, 명단 복귀는 원래 행으로 focus를 이동한다. 외부 artist 링크·음원 데이터는 현재 공개 DTO에 없다.
- Transmit는 작성/공개 기록, Signal은 설명/연락처 입력으로 구성한다. 모바일에서는 같은 form DOM을 세로로 재배치한다. 조회·제출 실패와 실제 성공을 구분하고 기존 초안·동의·idempotency 규칙을 유지한다.
- Status는 실제 지표와 날짜 기준의 행사 기록을 사용한다. About과 공식 채널은 실제 소개·링크를 제공한다. 임의 서버 상태·대기열·QR·입장권을 생성하지 않는다.
- 선택형 Boot는 버튼으로 연출을 건너뛰고 언어를 직접 선택한다. 일반 Tab·pointer 입력이 단계 전환을 실행하지 않는다. Sleep은 KST 시계를 표시하고 탭을 숨기면 타이머를 정지한다. 완료·복귀는 한 번만 실행한다.
- 404는 자체 의미 텍스트와 이동 링크를, global-error는 provider·root CSS에 의존하지 않는 inline 스타일과 reset/Home 복구를 제공한다. 원본 오류 메시지는 출력하지 않는다.

## 4. 개발 가이드라인

1. **신규 페이지 혹은 컴포넌트 개발 시 규칙:**
   - 정적 텍스트는 `<TerminalText>` 계열을 사용하되 plain rendering을 기본값으로 한다. `DecodeText` 직접 사용과 body/form/error/status cipher는 금지한다.
   - 새 장식 모션은 `lib/motion/gsap.ts`를 통해 등록된 GSAP과 `useGSAP`을 사용한다. 각 component의 ref로 scope를 제한하고 기존 motion 정책을 따른다.
2. **TypeScript 무결성 확보 규칙:**
   - hook, 브라우저 API, Framer Motion을 사용하는 컴포넌트만 client boundary로 선언한다.
   - `@react-three/fiber`는 `/?experience=terminal`의 선택형 ambient에 사용한다. motion 허용, 체험 viewport 진입, WebGL 지원이 모두 참일 때 dynamic chunk를 로드하며 오류 시 의미 텍스트와 조작을 그대로 유지한다.
3. **환경 관리 가이드 (Docker):**
   - 호스트 개발은 저장소 루트의 npm 스크립트를 사용한다. Docker 전용 환경에서 패키지를 추가할 때는 실행 중인 컨테이너의 `docker compose exec web npm install <패키지>`를 사용해 anonymous `node_modules` volume과의 불일치를 피한다.

## 5. 통합 디자인 시스템 및 테마 관리

프로젝트의 시각적 일관성과 유지보수성 확보를 위해 하드코딩된 색상 및 수치를 배제하고 전역 디자인 토큰 시스템으로 전환됨.

### 5.1 Tailwind 테마 확장 (Design Tokens)

- **위치:** `tailwind.config.js`, `app/globals.css`
- **핵심 테마 변수:**
  - `terminal-primary`: 기본 텍스트 `#D0D0D0`
  - `terminal-accent-primary`: 브랜드 강조 `#FF5D00`; 오렌지 면의 텍스트는 어두운 배경색 역할 사용
  - `terminal-accent-*`: 강조색 토큰 (`primary`, `secondary`, `tertiary`, `alert`, `warn`)
  - `terminal-bg-*`: 배경색 토큰 (`panel`, `panel-border`)
  - `terminal-muted`, `terminal-subdued`: 보조 및 비활성 텍스트 테마
- **커스텀 유틸리티:**
  - `.text-shadow-glow-*`: 각 테마 강조색에 대응하는 텍스트 글로우 효과 유틸리티 제공.

### 5.2 컴포넌트 표준화 원칙

- 기능 페이지는 `<PageLayout>`을 사용하고 각 capability가 화면 구성과 필요한 모션을 소유한다. 모든 자식에 일괄 stagger를 적용하지 않는다. 체험과 복구 경계는 독립적인 layout을 사용한다.
- 공통 UI 요소(`ReturnLink`, `PageHeader`, `TerminalPanel`, `TerminalButton`)를 적극 활용하여 인라인 스타일 및 중복 마크업을 최소화함.

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
- **CI와 배포:** `.github/workflows/validate.yml`은 secret 없이 install/audit/migration-history/test/lint/typecheck/build/Next·Worker smoke/D1/production-env dry-run을 실행한다. Cloudflare Workers Builds가 `dev`의 `terminal-2-dev`와 `main`의 `terminal-2`를 각각 자동 배포하며, Worker code deploy와 D1 migration·secret·binding·route 변경은 분리한다. development와 production remote migration은 각각 `--env development`와 `--env production`으로 list/apply/사후 검증하며 한 환경의 결과를 다른 환경의 증거로 사용하지 않는다.
