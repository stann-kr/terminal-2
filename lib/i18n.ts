/** 홈 DIRS 설명 — KO */
export const dirDescKo: Record<string, string> = {
  about: "서울 기반 테크노 플랫폼 TERMINAL",
  gate: "일정·장소·게스트 신청 안내",
  lineup: "참여 아티스트와 공연 시간",
  status: "이벤트와 참여 아티스트 기록",
  transmit: "방문자 로그",
  signal: "소식 구독 / 마케팅 수신 신청",
  link: "외부 채널 / 공식 링크",
};

/** About 페이지 MANIFESTO — KO */
export const manifestoKo: string[] = [
  "TERMINAL은 서울 기반의 테크노 플랫폼입니다.",
  "음악과 사람들이 만나는 공간을 만들고, 이벤트와 참여 아티스트의 기록을 이어갑니다.",
  "이곳에서 행사 일정과 장소, 라인업을 확인하고 게스트 신청을 할 수 있습니다.",
  "Terminal Architect: STANN LUMO",
];

// ─────────────────────────────────────────────
// COMMON (공통)
// ─────────────────────────────────────────────

export const commonKo = {
  signalUnstable: "정보를 불러오지 못했습니다.",
  dbUnreachable: "연결을 확인한 뒤 다시 시도해 주세요.",
  retry: "다시 시도",
  skipToContent: "본문으로 건너뛰기",
  signalNetAria: "STANN OS 표면 간 이동",
};

// ─────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────

export const homeKo = {
  loading: "이벤트를 불러오는 중입니다.",
  noEvents: "표시할 이벤트가 없습니다.",
  nextEntry: "다음 이벤트",
  lastEntry: "지난 이벤트",
  viewEvent: "▶ 이벤트 보기",
  viewArchive: "▶ 아카이브 보기",
  rootDir: "▶ 루트 디렉토리 — /terminal/",
  moduleCount: (count: number) => `${count} 모듈`,
};

// ─────────────────────────────────────────────
// GATE
// ─────────────────────────────────────────────

export const gateKo = {
  tabUpcoming: "진행 중·예정",
  tabArchive: "지난 이벤트",
  loading: "이벤트를 불러오는 중입니다.",
  requestBtn: "▶ 게스트 신청",
  archivedLabel: "지난 이벤트됨",
  noArchive: "기록된 아카이브가 없습니다.",
  locationWarning: "⚠ 세션 참가를 위한 상세 위치 및 게이트 정보입니다.",
  /** `◼ 세션 종료 — ${date}` */
  sessionArchived: (date: string) => `◼ 세션 종료 — ${date}`,
  eventInfoTitle: "EVENT_INFO.dec",
};

// ─────────────────────────────────────────────
// GATE / REQUEST ACCESS
// ─────────────────────────────────────────────

export const requestKo = {
  loading: "▸ 신청 데이터 로딩 중...",
  eventLoadFailed: "신청 정보를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.",
  retry: "다시 시도",
  periodInactive: "⚠ 신청 기간 아님",
  /** `다음 신청 가능 기간은 이벤트 ${days}일 전에 열립니다` */
  windowInfo: (days: number) =>
    `다음 신청 가능 기간은 이벤트 ${days}일 전에 열립니다`,
  eventDate: (date: string, time: string) => `이벤트 날짜 — ${date} · ${time}`,
  /** `신청 가능까지 T-${n}일` */
  windowCountdown: (n: number) => `신청 가능까지 T-${n}일`,
  eventElapsed: "이벤트가 종료되어 신청이 닫혔습니다.",
  noEvent: "현재 신청 가능한 예정 이벤트가 없습니다.",
  committed: "신청 접수 완료",
  committedSub: "접수는 입장 확정을 뜻하지 않습니다.",
  invitationLines: [
    "초대인에게 받은 인증 코드를 입력해 주세요.",
    "신청 대상 이벤트와 이름·연락처를 확인한 뒤 제출하세요.",
    "신청 접수는 입장 확정을 뜻하지 않습니다.",
  ],
  // 폼 레이블
  labelCode: "인증 코드:",
  labelInvitedBy: "초대인:",
  labelName: "이름:",
  labelEmail: "이메일:",
  labelInstagram: "인스타그램 ID:",
  // 플레이스홀더
  placeholderCode: "초대인에게 받은 코드",
  placeholderInvitedBy: "초대인 이름",
  placeholderName: "전체 이름",
  placeholderEmail: "이메일@주소.COM",
  placeholderInstagram: "@사용자명",
  // 개인정보 동의
  privacyConsent:
    "이름·이메일·인스타그램 ID를 게스트 접근 관리 목적으로 수집합니다. 보존 기간: 이벤트 종료 후 1개월. 제3자 미공개.",
  marketingConsent:
    "[선택] 차기 이벤트 소식를 이메일·인스타그램 채널로 수신합니다. 보존 기간: 수신 거부 시까지.",
  // 버튼
  submitting: "▸ 전송 중...",
  submitBtn: "▶ 신청 제출",
  // 초대인 선택
  invitedByOther: "기타",
  invitedByOtherPlaceholder: "초대인 이름 직접 입력",
  codeVerifying: "인증 코드를 확인 중입니다.",
  codeVerified: (artistName: string) => `인증 코드 확인됨 — ${artistName}`,
  codeVerificationUnavailable: "인증 코드를 확인할 수 없습니다. 연결을 확인한 뒤 다시 시도하세요.",
  // 에러
  errors: {
    ALL_FIELDS_REQUIRED: "모든 항목을 입력해주세요.",
    PRIVACY_CONSENT_REQUIRED: "개인정보 동의가 필요합니다.",
    INVALID_EMAIL_FORMAT: "이메일 형식이 올바르지 않습니다.",
    INVALID_INPUT: "입력값이 올바르지 않습니다.",
    INVALID_INSTAGRAM_FORMAT: "인스타그램 형식이 올바르지 않습니다.",
    NO_UPCOMING_EVENT: "예정된 이벤트가 없습니다.",
    REQUEST_PERIOD_INACTIVE: "신청 기간이 아닙니다.",
    INVALID_ACCESS_CODE: "유효하지 않은 인증 코드입니다.",
    GUEST_LIMIT_REACHED: "해당 코드의 게스트 정원이 마감되었습니다.",
    EMAIL_ALREADY_REGISTERED: "이미 등록된 이메일입니다.",
    INTERNAL_SERVER_ERROR: "전송 실패. 나중에 다시 시도하세요.",
    TRANSMISSION_FAILED: "전송 실패.",
    CONNECTION_ERROR: "전송 실패. 연결을 확인하세요.",
  },
};

// ─────────────────────────────────────────────
// LINEUP
// ─────────────────────────────────────────────

export const lineupKo = {
  loading: "▸ 라인업 데이터 로딩 중...",
  upcomingTag: "예정",
  /** `${n} 아티스트` */
  actCount: (n: number) => `${n} 아티스트`,
  colArtist: "아티스트",
  colTimeslot: "타임슬롯",
  colStatus: "상태",
  footerUpcoming: "공개된 라인업입니다.",
  footerArchived: "이 이벤트에 참여한 아티스트 기록입니다.",
  /** `도크 ${dock}` */
  dock: (dock: string) => `도크 ${dock}`,
};

// ─────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────

export const statusKo = {
  labelSessionsRun: "지난 이벤트",
  labelNextLaunch: "다음 이벤트",
  labelArtistNodes: "참여 아티스트",
  unitArchived: "SESSIONS",
  unitStandby: "STANDBY",
  unitConfirmed: "ARTISTS",
  sessionLogTitle: "이벤트 기록",
  colSession: "세션",
  colDate: "날짜",
  colArtists: "아티스트",
  colStatus: "상태",
  loading: "이벤트 기록을 불러오는 중입니다.",
  noSessions: "기록된 이벤트가 없습니다.",
};

// ─────────────────────────────────────────────
// TRANSMIT
// ─────────────────────────────────────────────

export const transmitKo = {
  title: "방명록",
  formTitle: "글 남기기",
  publicNotice: "별칭과 메시지는 누구나 볼 수 있는 방명록에 게시됩니다. 연락처 등 개인정보를 남기지 마세요.",
  previousPageLabel: "이전 글 페이지",
  nextPageLabel: "다음 글 페이지",
  labelAlias: "별칭:",
  labelMessage: "메시지:",
  placeholderAlias: "별칭 입력",
  placeholderMsg: "남기고 싶은 메시지",
  committed: "제출한 메시지를 게시했습니다.",
  submitting: "▸ 전송 중...",
  submitBtn: "메시지 게시",
  syncing: "글을 불러오는 중입니다.",
  noEntries: "기록 없음.",
  /** `방명록 — ${n}개 기록` */
  logTitle: (n: number) => `방명록 — ${n}개 기록`,
  logSyncing: "방명록 — 동기화 중...",
  prevBtn: "◀ 이전",
  nextBtn: "다음 ▶",
  logLoadFailed: "방명록를 불러오지 못했습니다. 다시 시도하세요.",
  retry: "다시 시도",
  errors: {
    required: "별칭과 메시지를 입력해주세요.",
    tooLong: "메시지가 280자를 초과합니다.",
    failed: "전송 실패.",
    connection: "전송 실패. 연결을 확인하세요.",
    linkUnstable: "신호 링크 불안정.",
  },
};

// ─────────────────────────────────────────────
// SIGNAL
// ─────────────────────────────────────────────

export const signalKo = {
  description: [
    "TERMINAL 이벤트 소식 수신을 위한 채널을 등록합니다.",
    "이메일과 인스타그램 연락처를 저장합니다.",
  ],
  labelEmail: "이메일:",
  labelInstagram: "인스타그램 ID:",
  placeholderEmail: "이메일@주소.COM",
  consentLabel:
    "이메일·인스타그램 계정을 TERMINAL 이벤트 소식 안내 목적으로 수집하는 데 동의합니다.",
  submitting: "저장 중...",
  submitBtn: "소식 신청",
  committed: "소식 신청을 저장했습니다.",
  committedSub: "이벤트 소식을 위한 연락처가 저장되었습니다.",
  errors: {
    ALL_FIELDS_REQUIRED: "이메일과 인스타그램을 입력해주세요.",
    CONSENT_REQUIRED: "동의가 필요합니다.",
    INVALID_EMAIL_FORMAT: "이메일 형식이 올바르지 않습니다.",
    INVALID_INSTAGRAM_FORMAT: "인스타그램 형식이 올바르지 않습니다.",
    EMAIL_ALREADY_SUBSCRIBED: "이미 구독 중인 이메일입니다.",
    TRANSMISSION_FAILED: "전송 실패.",
    CONNECTION_ERROR: "전송 실패. 연결을 확인하세요.",
  },
};

// ─────────────────────────────────────────────
// LINK
// ─────────────────────────────────────────────

export const linkKo = {
  externalChannels: "공식 채널",
  nodeCount: "4개 채널",
  descriptions: {
    stannHub: "STANN의 프로젝트와 작업",
    stannWeb: "공식 웹사이트 / 비주얼 아카이브",
    stannInsta: "소셜 채널 / 업데이트",
    terminalInsta: "이벤트 소식",
  },
};

// ─────────────────────────────────────────────
// 영문 번역 객체 (EN)
// ─────────────────────────────────────────────

/** 홈 DIRS 설명 — EN */
export const dirDescEn: Record<string, string> = {
  about: "About TERMINAL",
  gate: "Dates, venues and guest requests",
  lineup: "Artists and set times",
  status: "Event and artist history",
  transmit: "Public guestbook",
  signal: "Sign up for event updates",
  link: "EXTERNAL CHANNELS / OFFICIAL LINKS",
};

/** About 페이지 MANIFESTO — EN */
export const manifestoEn: string[] = [
  "TERMINAL is a Seoul-based techno platform.",
  "We create spaces for music and people, and keep a record of our events and artists.",
  "Explore event dates, venues and lineups, and submit a guest request here.",
  "Terminal Architect: STANN LUMO",
];

export const commonEn = {
  signalUnstable: "Information could not be loaded.",
  dbUnreachable: "Check your connection and try again.",
  retry: "RETRY",
  skipToContent: "SKIP TO CONTENT",
  signalNetAria: "Navigate between STANN OS surfaces",
};

export const homeEn = {
  loading: "▸ LOADING EVENT DATA...",
  noEvents: "NO EVENTS AVAILABLE.",
  nextEntry: "Next event —",
  lastEntry: "Past event —",
  viewEvent: "▶ VIEW EVENT",
  viewArchive: "▶ VIEW ARCHIVE",
  rootDir: "▶ ROOT DIRECTORY — /terminal/",
  moduleCount: (count: number) => `${count} MODULES`,
};

export const gateEn = {
  tabUpcoming: "Live & upcoming",
  tabArchive: "Past events",
  loading: "Loading event details...",
  requestBtn: "▶ GUEST REQUEST",
  archivedLabel: "Past eventsD",
  noArchive: "NO ARCHIVED SESSIONS AVAILABLE.",
  locationWarning:
    "⚠ DETAILED LOCATION AND GATE INFORMATION FOR SESSION ENTRY.",
  sessionArchived: (date: string) => `◼ SESSION ARCHIVED — ${date}`,
  eventInfoTitle: "About this event",
};

export const requestEn = {
  loading: "▸ LOADING REQUEST DATA...",
  eventLoadFailed: "REQUEST DATA COULD NOT BE LOADED. CHECK YOUR CONNECTION AND RETRY.",
  retry: "RETRY",
  periodInactive: "⚠ REQUEST PERIOD INACTIVE",
  windowInfo: (days: number) =>
    `NEXT RESPONSE WINDOW OPENS ${days} DAYS BEFORE EVENT`,
  eventDate: (date: string, time: string) => `EVENT DATE — ${date} · ${time}`,
  windowCountdown: (n: number) => `WINDOW OPENS IN T-${n} DAYS`,
  eventElapsed: "EVENT HAS ELAPSED — REQUEST WINDOW CLOSED.",
  noEvent: "There is no upcoming event accepting requests.",
  committed: "Request received",
  committedSub: "Submission does not confirm admission.",
  invitationLines: [
    "Enter the access code provided by your inviter.",
    "Check the event, name and contact details before submitting.",
    "Submitting a request does not confirm admission.",
  ],
  labelCode: "ACCESS CODE:",
  labelInvitedBy: "INVITED BY:",
  labelName: "NAME:",
  labelEmail: "EMAIL:",
  labelInstagram: "INSTAGRAM ID:",
  placeholderCode: "SESSION ACCESS CODE",
  placeholderInvitedBy: "INVITER NAME",
  placeholderName: "FULL NAME",
  placeholderEmail: "EMAIL@ADDRESS.COM",
  placeholderInstagram: "@USERNAME",
  privacyConsent:
    "Name, email, and Instagram ID will be collected for guest access management. Retention: 1 month after event. Not disclosed to third parties.",
  marketingConsent:
    "[OPTIONAL] Subscribe to receive future event signals via email or Instagram DM. Retention: until unsubscribed.",
  submitting: "▸ TRANSMITTING...",
  submitBtn: "▶ SUBMIT REQUEST",
  // invitedBy options
  invitedByOther: "OTHER",
  invitedByOtherPlaceholder: "ENTER INVITER NAME",
  codeVerifying: "VERIFYING ACCESS CODE...",
  codeVerified: (artistName: string) => `ACCESS CODE VERIFIED — ${artistName}`,
  codeVerificationUnavailable: "ACCESS CODE COULD NOT BE VERIFIED. CHECK YOUR CONNECTION AND RETRY.",
  // errors
  errors: {
    ALL_FIELDS_REQUIRED: "ALL FIELDS ARE REQUIRED.",
    PRIVACY_CONSENT_REQUIRED: "PRIVACY CONSENT IS REQUIRED.",
    INVALID_EMAIL_FORMAT: "INVALID EMAIL FORMAT.",
    INVALID_INPUT: "INVALID INPUT.",
    INVALID_INSTAGRAM_FORMAT: "INVALID INSTAGRAM FORMAT.",
    NO_UPCOMING_EVENT: "NO UPCOMING EVENT FOUND.",
    REQUEST_PERIOD_INACTIVE: "REQUEST PERIOD IS NOT ACTIVE.",
    INVALID_ACCESS_CODE: "INVALID ACCESS CODE.",
    GUEST_LIMIT_REACHED: "GUEST CAPACITY FOR THIS CODE HAS BEEN REACHED.",
    EMAIL_ALREADY_REGISTERED: "THIS EMAIL HAS ALREADY BEEN REGISTERED.",
    INTERNAL_SERVER_ERROR: "TRANSMISSION FAILED. RETRY LATER.",
    TRANSMISSION_FAILED: "TRANSMISSION FAILED.",
    CONNECTION_ERROR: "TRANSMISSION FAILED. CHECK CONNECTION.",
  },
};

export const lineupEn = {
  loading: "▸ LOADING LINEUP DATA...",
  upcomingTag: "UPCOMING",
  actCount: (n: number) => `${n} ARTISTS`,
  colArtist: "ARTIST",
  colTimeslot: "TIMESLOT",
  colStatus: "STATUS",
  footerUpcoming: "Published lineup.",
  footerArchived: "Artists who took part in this event.",
  dock: (dock: string) => `DOCK ${dock}`,
};

export const statusEn = {
  labelSessionsRun: "Past events",
  labelNextLaunch: "Next event",
  labelArtistNodes: "Participating artists",
  unitArchived: "SESSIONS",
  unitStandby: "STANDBY",
  unitConfirmed: "ARTISTS",
  sessionLogTitle: "Event history",
  colSession: "SESSION",
  colDate: "DATE",
  colArtists: "ARTISTS",
  colStatus: "STATUS",
  loading: "Loading event history...",
  noSessions: "No events recorded.",
};

export const transmitEn = {
  title: "Guestbook",
  formTitle: "Leave a message",
  publicNotice: "Your alias and message are posted publicly. Do not include contact details or other personal information.",
  previousPageLabel: "Previous entries page",
  nextPageLabel: "Next entries page",
  labelAlias: "ALIAS:",
  labelMessage: "MESSAGE:",
  placeholderAlias: "ENTER ALIAS",
  placeholderMsg: "Leave a message",
  committed: "Your submitted message has been posted.",
  submitting: "▸ TRANSMITTING...",
  submitBtn: "Post message",
  syncing: "Loading entries...",
  noEntries: "NO ENTRIES.",
  logTitle: (n: number) => `Guestbook — ${n} ENTRIES`,
  logSyncing: "Guestbook — SYNCING...",
  prevBtn: "◀ PREV",
  nextBtn: "NEXT ▶",
  logLoadFailed: "Guestbook COULD NOT BE LOADED. RETRY.",
  retry: "RETRY",
  errors: {
    required: "ENTER ALIAS AND MESSAGE.",
    tooLong: "MESSAGE EXCEEDS 280 CHARACTERS.",
    failed: "TRANSMISSION FAILED.",
    connection: "TRANSMISSION FAILED. CHECK CONNECTION.",
    linkUnstable: "SIGNAL LINK UNSTABLE.",
  },
};

export const signalEn = {
  description: [
    "REGISTER YOUR RECEPTION CHANNEL FOR TERMINAL EVENT SIGNALS.",
    "We save your email and Instagram contact details.",
  ],
  labelEmail: "EMAIL:",
  labelInstagram: "INSTAGRAM ID:",
  placeholderEmail: "EMAIL@ADDRESS.COM",
  consentLabel:
    "I agree to the collection of my email and Instagram account for TERMINAL event updates.",
  submitting: "Saving...",
  submitBtn: "Sign up for updates",
  committed: "Your request for updates is saved.",
  committedSub: "Your contact details have been saved for event updates.",
  errors: {
    ALL_FIELDS_REQUIRED: "EMAIL AND INSTAGRAM ARE REQUIRED.",
    CONSENT_REQUIRED: "CONSENT IS REQUIRED.",
    INVALID_EMAIL_FORMAT: "INVALID EMAIL FORMAT.",
    INVALID_INSTAGRAM_FORMAT: "INVALID INSTAGRAM FORMAT.",
    EMAIL_ALREADY_SUBSCRIBED: "THIS EMAIL IS ALREADY SUBSCRIBED.",
    TRANSMISSION_FAILED: "TRANSMISSION FAILED.",
    CONNECTION_ERROR: "TRANSMISSION FAILED. CHECK CONNECTION.",
  },
};

export const linkEn = {
  externalChannels: "Official channels",
  nodeCount: "4 channels",
  descriptions: {
    stannHub: "STANN OS HUB — OPERATOR HQ",
    stannWeb: "OFFICIAL WEBSITE / VISUAL ARCHIVE",
    stannInsta: "SOCIAL CHANNEL / UPDATES",
    terminalInsta: "EVENT FEED / SIGNAL BROADCAST",
  },
};

// ─────────────────────────────────────────────
// 통합 i18n 객체
// ─────────────────────────────────────────────

export const i18n = {
  ko: {
    dirDesc: dirDescKo,
    manifesto: manifestoKo,
    common: commonKo,
    home: homeKo,
    gate: gateKo,
    request: requestKo,
    lineup: lineupKo,
    status: statusKo,
    transmit: transmitKo,
    signal: signalKo,
    link: linkKo,
  },
  en: {
    dirDesc: dirDescEn,
    manifesto: manifestoEn,
    common: commonEn,
    home: homeEn,
    gate: gateEn,
    request: requestEn,
    lineup: lineupEn,
    status: statusEn,
    transmit: transmitEn,
    signal: signalEn,
    link: linkEn,
  },
} as const;

export type I18nLang = keyof typeof i18n;
export type Translations = (typeof i18n)["ko"];
