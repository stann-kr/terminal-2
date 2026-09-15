# TERMINAL — Aspen 격자 목업

검정·오렌지, 기존 Pixie/Orbit 서체, 화면 전체 CRT 유리와 고정 header/footer를 유지하는 독립 목업입니다. 4열 기준선으로 Home, Gate, Lineup, Guest Request, Status, Transmit, Signal, About, Link를 구성합니다.

## 실행

저장소에서 설치한 기존 React/esbuild와 lockfile을 사용합니다. 새 의존성은 없습니다.

```sh
node mockups/aspen-terminal/build.mjs
node mockups/aspen-terminal/build.mjs --serve
```

- 생성 파일: `mockups/aspen-terminal/dist/index.html`. 폰트·CSS·JS가 포함되어 파일만 열어도 동작합니다.
- 로컬 주소: `http://127.0.0.1:3005`. 이미 사용 중인 3005 서버를 자동 종료하거나 다른 포트로 변경하지 않습니다.
- 직접 진입: `#/home`, `#/gate?event=TRM-02`, `#/lineup?event=TRM-01&artist=01-B`, `#/gate/request`, `#/signal` 등. 제품 URL을 바꾸지 않는 목업 내부 hash입니다.
- 수정 후 첫 명령으로 다시 빌드하고 새로고침합니다. 생성물은 ignored `dist/`에만 둡니다.

## 검토 범위

상단 **검토 옵션**에서 지난 행사, 접수 기간 가정, 진행 중 가정, 공개 행사 없음, 데이터 오류, 긴 제목을 선택합니다. 포스터 분기는 본인 로컬 이미지를 선택해 확인합니다. 이미지 오류는 회차 구성으로 돌아갑니다.

- 기본 데이터는 2026-09-15 로컬 D1의 행사·아티스트 공개 필드 스냅샷입니다. 제품 lifecycle 규칙과 기준 시각을 적용해 과거 날짜의 UPCOMING도 지난 행사로 표시합니다. 운영 서비스의 현재 상태는 아닙니다.
- 공개 이름은 `CONFIRMED`/`ARCHIVED` 상태로 판단합니다. 기본 아티스트는 URL이나 focus를 자동으로 변경하지 않습니다. 잘못된/미공개 artist URL은 별도 안내합니다.
- 접수 가정은 2026-05-01 기준 TRM-02 신청 화면입니다. 체험 코드는 `DEMO02`. 실제 코드 검증이나 초대 권한이 아닙니다.
- 신청·소식은 필드/동의 확인, 제출 중, 실패 후 재시도, 결과, 화면 이동 후 초안 유지를 제공합니다. 실제 API/인증/중복 경쟁/영속 저장과 연결하지 않습니다. 행사·기간 변경은 코드 확인을 해제하고 진행 중 결과를 취소합니다.
- 방명록은 빈 상태로 시작합니다. 작성 글은 메모리에만 추가되며 검토 옵션의 7개 예시는 명시적으로 구분합니다. 페이지 실패 후 현재 글/초안과 이전 페이지 복귀를 유지합니다.
- 입력은 서버에 전송되지 않습니다. CSP의 `connect-src 'none'`과 `form-action 'none'`으로 네트워크 전송을 막습니다. 새로고침하면 초안과 결과가 초기화됩니다. 공식 외부 링크는 새 탭에서 열립니다.

## 소유 범위

`shell/`은 고정 프레임·메뉴·CRT, `events/`는 스냅샷·홈·상세, `lineup/`은 선택과 소개, `forms/`는 신청·소식, `transmit/`은 방명록, `info/`는 기록·소개·링크를 맡습니다. 각 화면의 스타일은 해당 폴더에 둡니다. 실제 Next route, API, DB, 공통 디자인 토큰, migration/patch는 변경하지 않습니다.
