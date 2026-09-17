import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../mockups/aspen-terminal/App';
import { ENTRY_VISIT_KEY, chooseEntryLanguage, completeEntryVisit } from '../mockups/aspen-terminal/entry/visitState';
import { gsap } from '../mockups/aspen-terminal/motion/MotionProvider';
import { measureReadout } from '../mockups/aspen-terminal/motion/readoutLines';

function active() {
  const element = document.querySelector<HTMLElement>('[data-active="true"]');
  if (!element) throw new Error('No active mockup screen');
  return within(element);
}

async function navigate(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function scenario(value: string) {
  fireEvent.change(screen.getByLabelText('데이터 상태'), { target: { value } });
}

beforeEach(() => {
  window.history.replaceState(null, '', '/#/home');
  window.localStorage.removeItem(ENTRY_VISIT_KEY);
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ko-KR', 'en-US']);
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('ko-KR');
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('The mockup must not call the network'); }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('isolated Aspen terminal mockup', () => {
  it('restores the event clock with distinct remaining and elapsed states and advances its preview seconds', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-09-17T00:00:00+09:00'));
      render(<App />);
      expect(active().getByRole('timer', { name: '이벤트 시작 후 경과 시간' })).toHaveTextContent('T+ ELAPSED');
      scenario('upcoming');
      const countdown = active().getByRole('timer', { name: '이벤트 시작까지 남은 시간' });
      expect(countdown).toHaveTextContent('T− COUNTDOWN');
      expect(countdown).toHaveTextContent('체험 시계');
      expect([...countdown.querySelectorAll('dd')].map(node => node.textContent)).toEqual(['07', '00', '00', '00']);
      act(() => { vi.advanceTimersByTime(1000); });
      expect([...countdown.querySelectorAll('dd')].map(node => node.textContent)).toEqual(['06', '23', '59', '59']);
      expect(countdown).toHaveAttribute('aria-live', 'off');
      scenario('empty');
      expect(active().queryByRole('timer')).not.toBeInTheDocument();
    } finally {
      cleanup();
      vi.useRealTimers();
    }
  });

  it('opens the dated archive, preserves the event through navigation and rejects an invalid event URL', async () => {
    render(<App />);
    expect(active().getByText('지난 이벤트')).toBeInTheDocument();
    expect(active().getByRole('link', { name: /아카이브 보기/ })).toHaveAttribute('href', '#/gate?event=TRM-02');
    await navigate('/gate?event=TRM-01');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('TERMINAL [01]');
    expect(active().getByRole('link', { name: /라인업 보기/ })).toHaveAttribute('href', '#/lineup?event=TRM-01');
    const navigation = within(screen.getByRole('navigation', { name: '주요 메뉴' }));
    expect(navigation.getByRole('link', { name: /LINEUP/ })).toHaveAttribute('href', '#/lineup?event=TRM-01');
    expect(navigation.getByRole('link', { name: /GUEST_REQ/ })).toHaveAttribute('href', '#/gate/request?event=TRM-01');
    await userEvent.click(navigation.getByRole('link', { name: /LINEUP/ }));
    await waitFor(() => expect(active().getByLabelText('이벤트 선택')).toHaveValue('TRM-01'));
    expect(active().getByRole('link', { name: /MARCUS L/ })).toBeInTheDocument();
    expect(active().queryByRole('link', { name: /게스트 신청/ })).not.toBeInTheDocument();
    await navigate('/gate?event=missing');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('이벤트를 찾을 수 없습니다');
  });

  it('shows a public artist without changing the URL or focus and keeps invalid/unpublished selections explicit', async () => {
    await navigate('/lineup?event=TRM-02');
    render(<App />);
    expect(active().getByRole('heading', { name: 'STANN LUMO' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/lineup?event=TRM-02');
    expect(document.activeElement).toBe(document.body);
    expect(active().getByText(/그 외 4개 항목/)).toBeInTheDocument();
    expect(active().queryByRole('link', { name: /ENCRYPTED/ })).not.toBeInTheDocument();
    await navigate('/lineup?event=TRM-02&artist=02-B');
    expect(active().getByRole('heading', { name: '아티스트 정보 미공개' })).toBeInTheDocument();
    expect(active().queryByRole('heading', { name: 'STANN LUMO' })).not.toBeInTheDocument();
    await navigate('/lineup?event=TRM-02&artist=missing');
    expect(active().getByRole('heading', { name: '아티스트를 찾을 수 없습니다.' })).toBeInTheDocument();
  });

  it('retains the Signal draft through navigation and a failed attempt, validates consent, and completes offline', async () => {
    const user = userEvent.setup();
    await navigate('/signal');
    render(<App />);
    await user.type(active().getByLabelText('이메일'), 'reader@example.com');
    await user.type(active().getByLabelText('인스타그램 ID'), '@reader');
    await user.click(active().getByRole('button', { name: /소식 신청/ }));
    await waitFor(() => expect(active().getByRole('checkbox')).toHaveFocus());
    expect(active().getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    await user.click(active().getByRole('checkbox'));
    await navigate('/about');
    await navigate('/signal');
    expect(active().getByLabelText('이메일')).toHaveValue('reader@example.com');
    fireEvent.change(screen.getByLabelText('제출 결과'), { target: { value: 'error' } });
    await user.click(active().getByRole('button', { name: /소식 신청/ }));
    expect(active().getByRole('button', { name: /처리 중/ })).toBeDisabled();
    await waitFor(() => expect(active().getByRole('alert')).toHaveTextContent('전송 실패 예시'));
    expect(active().getByLabelText('이메일')).toHaveValue('reader@example.com');
    fireEvent.change(screen.getByLabelText('제출 결과'), { target: { value: 'success' } });
    await user.click(active().getByRole('button', { name: /소식 신청/ }));
    await waitFor(() => expect(active().getByRole('heading', { name: '소식 신청 완료' })).toHaveFocus());
    expect(active().getByText(/실제로 전송되거나 저장되지 않습니다/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('unlocks only the preview request code and keeps target changes from claiming a stale submission', async () => {
    const user = userEvent.setup();
    await navigate('/gate/request?event=TRM-02');
    render(<App />);
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('현재 신청 가능한');
    scenario('upcoming');
    expect(active().getByLabelText('이름')).toBeDisabled();
    await user.type(active().getByLabelText('인증 코드'), 'WRONG');
    expect(active().getByLabelText('인증 코드')).toHaveAttribute('aria-invalid', 'false');
    await user.click(active().getByRole('button', { name: '확인' }));
    expect(active().getByLabelText('인증 코드')).toHaveAttribute('aria-invalid', 'true');
    await user.clear(active().getByLabelText('인증 코드'));
    await user.type(active().getByLabelText('인증 코드'), 'DEMO02');
    await user.click(active().getByRole('button', { name: '확인' }));
    await user.type(active().getByLabelText('이름'), '목업 방문자');
    await user.type(active().getByLabelText('이메일'), 'guest@example.com');
    await user.type(active().getByLabelText('인스타그램 ID'), '@guest');
    await user.click(active().getByRole('checkbox', { name: /게스트 접근 관리/ }));
    await user.click(active().getByRole('button', { name: /신청 제출/ }));
    expect(active().getByRole('button', { name: /처리 중/ })).toBeDisabled();
    scenario('snapshot');
    expect(active().queryByText('신청 접수 완료')).not.toBeInTheDocument();
    scenario('upcoming');
    expect(active().getByLabelText('이름')).toHaveValue('목업 방문자');
    expect(active().getByLabelText('이름')).toBeDisabled();
    await user.click(active().getByRole('button', { name: '확인' }));
    await user.click(active().getByRole('button', { name: /신청 제출/ }));
    await waitFor(() => expect(active().getByRole('heading', { name: '신청 접수 완료' })).toBeInTheDocument());
    const result = active().getByRole('heading', { name: '신청 접수 완료' }).parentElement!;
    expect(within(result).getByText('접수는 입장 확정을 뜻하지 않습니다.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves guestbook draft and previous-page recovery when the next page fails', async () => {
    const user = userEvent.setup();
    await navigate('/transmit');
    render(<App />);
    expect(active().getByText('게시된 글이 없습니다.')).toBeInTheDocument();
    await user.type(active().getByLabelText('별칭'), 'DRAFT');
    await user.type(active().getByLabelText(/메시지/), '아직 제출하지 않은 글');
    fireEvent.change(screen.getByLabelText('방명록 내용'), { target: { value: 'sample' } });
    await user.click(active().getByRole('button', { name: '다음' }));
    expect(active().getByText('SAMPLE_04')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('제출 결과'), { target: { value: 'error' } });
    await user.click(active().getByRole('button', { name: '다음' }));
    expect(active().getByRole('alert')).toHaveTextContent('다음 페이지를 불러오지 못했습니다');
    await user.click(active().getByRole('button', { name: '이전' }));
    expect(active().getByText('SAMPLE_01')).toBeInTheDocument();
    expect(active().getByLabelText(/메시지/)).toHaveValue('아직 제출하지 않은 글');
    await navigate('/home');
    await navigate('/transmit');
    expect(active().getByLabelText('별칭')).toHaveValue('DRAFT');
  });

  it('falls back from a failed poster and recovers the data error without a request', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '이미지 오류 복귀 확인' }));
    fireEvent.error(active().getByRole('img'));
    expect(active().queryByRole('img')).not.toBeInTheDocument();
    expect(active().getByText('[02]')).toBeInTheDocument();
    scenario('error');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('정보를 불러오지 못했습니다');
    fireEvent.click(active().getByRole('button', { name: '다시 시도' }));
    expect(active().getByRole('link', { name: /아카이브 보기/ })).toBeInTheDocument();
    expect(active().getByRole('heading', { level: 1 })).toHaveFocus();
    scenario('empty');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('공개된 이벤트가 없습니다');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps every screen usable in both languages and restores the mobile menu trigger on Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const language of ['ko', 'en']) {
      if (language === 'en') await user.click(screen.getByRole('button', { name: '영어로 보기' }));
      for (const path of ['/home', '/gate', '/lineup', '/gate/request', '/status', '/transmit', '/signal', '/about', '/link']) {
        await navigate(path);
        expect(active().getByRole('heading', { level: 1 }).textContent?.trim()).toBeTruthy();
      }
      expect(document.documentElement.lang).toBe(language);
    }
    const menu = screen.getByRole('button', { name: /Menu/ });
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveFocus();
    const crt = screen.getByRole('button', { name: 'CRT display effects' });
    await user.click(crt);
    expect(crt).toHaveAttribute('aria-pressed', 'false');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('mockup motion continuity', () => {
  it.each(['keyboard', 'wheel'] as const)('holds layout surfaces until their output step and restores them on %s interaction', interaction => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ media: query, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    try {
      render(<App />);
      gsap.globalTimeline.pause();
      const frame = document.querySelector('.tm-home-title');
      const action = active().getByRole('link', { name: /아카이브 보기/ });
      expect(frame).not.toBeVisible();
      expect(action).not.toBeVisible();
      expect(active().getByRole('heading', { level: 1 })).toHaveAccessibleName('TERMINAL');
      if (interaction === 'keyboard') fireEvent.keyDown(document.querySelector('main')!, { key: 'Tab' });
      else fireEvent.wheel(document.querySelector('main')!, { deltaY: 120 });
      expect(frame).toBeVisible();
      expect(action).toBeVisible();
      expect(active().getByRole('heading', { level: 1 })).toBeVisible();
    } finally {
      gsap.globalTimeline.resume();
    }
  });

  it('keeps inline fragments on one output line and reveals the next wrapped line separately', () => {
    const paragraph = document.createElement('p');
    paragraph.innerHTML = '첫 줄 <strong>강조</strong><br>Second line';
    vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 56));
    const range = document.createRange();
    Object.defineProperty(range, 'getClientRects', { value: () => [
      new DOMRect(0, 0, 160, 20), new DOMRect(165, 4, 30, 14),
      new DOMRect(0, 28, 150, 20),
    ] });
    vi.spyOn(document, 'createRange').mockReturnValue(range);
    const { bottoms } = measureReadout(paragraph);
    expect(bottoms).toHaveLength(2);
    const firstLineEdge = 56 - bottoms[0];
    expect(firstLineEdge).toBeGreaterThanOrEqual(20);
    expect(firstLineEdge).toBeLessThanOrEqual(28);
    expect(bottoms[1]).toBe(0);
    expect(paragraph.textContent).toBe('첫 줄 강조Second line');
  });

  it('keeps drafts and pending results usable across rapid routes and CRT changes', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ media: query, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const user = userEvent.setup();
    await navigate('/signal');
    render(<App />);
    await user.type(active().getByLabelText('이메일'), 'motion@example.com');
    expect(active().getByLabelText('이메일')).toHaveFocus();
    await navigate('/home');
    await navigate('/signal');
    expect(active().getByLabelText('이메일')).toHaveValue('motion@example.com');
    fireEvent.change(active().getByLabelText('인스타그램 ID'), { target: { value: '@motion' } });
    fireEvent.click(active().getByRole('checkbox'));
    fireEvent.click(active().getByRole('button', { name: '소식 신청' }));
    const pulse = active().getByRole('button', { name: '처리 중…' }).querySelector('[data-pending-pulse]')!;
    expect(gsap.getTweensOf(pulse)).not.toHaveLength(0);
    await navigate('/home');
    expect(gsap.getTweensOf(pulse)).toHaveLength(0);
    await navigate('/signal');
    fireEvent.click(screen.getByRole('button', { name: 'CRT 화면 효과' }));
    expect(gsap.getTweensOf(pulse)).toHaveLength(0);
    await waitFor(() => expect(active().getByRole('heading', { name: '소식 신청 완료' })).toHaveFocus());
    expect(active().getByText('motion@example.com')).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['(prefers-reduced-motion: reduce)', '(prefers-contrast: more)', '(forced-colors: active)'])('settles the display when %s changes and does not replay on restoration', async preferenceQuery => {
    let staticDisplay = false;
    const preference = new EventTarget();
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      media: query, get matches() { return query === preferenceQuery && staticDisplay; }, onchange: null,
      addEventListener: preference.addEventListener.bind(preference), removeEventListener: preference.removeEventListener.bind(preference),
      addListener() {}, removeListener() {}, dispatchEvent: preference.dispatchEvent.bind(preference),
    }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    render(<App />);
    const display = screen.getByRole('main').closest('.tm-shell');
    expect(display).toHaveAttribute('data-motion', 'true');
    const title = active().getByRole('heading', { level: 1 });
    expect(title).toHaveAccessibleName('TERMINAL');
    expect(title).toHaveTextContent(/^TERMINAL$/);
    expect(gsap.getTweensOf(title.querySelector('[data-readout-source]'))).not.toHaveLength(0);
    staticDisplay = true;
    act(() => preference.dispatchEvent(new Event('change')));
    expect(display).toHaveAttribute('data-motion', 'false');
    expect(gsap.getTweensOf(title.querySelector('[data-readout-source]'))).toHaveLength(0);
    expect(title).toBeVisible();
    expect(title.querySelector('[data-readout-source]')).toBeVisible();
    expect(title.querySelector('[data-readout-output]')).toHaveAttribute('data-readout-output', '');
    await navigate('/gate');
    const nextTitle = active().getByRole('heading', { level: 1 });
    expect(nextTitle).toHaveFocus();
    staticDisplay = false;
    act(() => preference.dispatchEvent(new Event('change')));
    expect(display).toHaveAttribute('data-motion', 'true');
    expect(nextTitle).toBeVisible();
    expect(gsap.getTweensOf(nextTitle.querySelector('[data-readout-source]'))).toHaveLength(0);
    const menu = screen.getByRole('button', { name: /메뉴/ });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveFocus();
  });

  it('preserves the current title and accessible name when output is interrupted by language and route changes', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ media: query, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await navigate('/about');
    render(<App />);
    expect(active().getByRole('heading', { level: 1 })).toHaveAccessibleName('TERMINAL 소개');
    fireEvent.click(screen.getByRole('button', { name: '영어로 보기' }));
    const title = active().getByRole('heading', { name: 'About TERMINAL', level: 1 });
    fireEvent.keyDown(title, { key: 'Tab' });
    expect(title).toHaveTextContent(/^About TERMINAL$/);
    expect(title.querySelector('[data-readout-source]')).toBeVisible();
    expect(title.querySelector('[data-readout-output]')).toHaveAttribute('data-readout-output', '');
    await navigate('/lineup');
    await navigate('/link');
    await waitFor(() => {
      for (const heading of active().getAllByRole('heading')) {
        expect(heading.querySelector('[data-readout-source]')).toBeVisible();
        expect(heading.querySelector('[data-readout-output]')).toHaveAttribute('data-readout-output', '');
      }
    }, { timeout: 2500 });
    expect(active().getByRole('heading', { level: 1 })).toHaveAccessibleName('Official channels');
    expect(active().queryByText('About TERMINAL')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('settles every content region on input or resize while keeping fields and drafts available', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ media: query, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await navigate('/transmit');
    render(<App />);
    const field = active().getByLabelText('별칭');
    expect(field).toBeInTheDocument();
    expect(field).toBeEnabled();
    const empty = active().getByText('게시된 글이 없습니다.');
    expect(empty.textContent).toBe('게시된 글이 없습니다.');
    fireEvent.input(field, { target: { value: 'LINE_TEST' } });
    expect(field).toHaveValue('LINE_TEST');
    expect(field).toBeVisible();
    expect(empty).toBeVisible();
    expect(empty.style.clipPath).toBe('');
    await navigate('/about');
    fireEvent(window, new Event('resize'));
    for (const text of document.querySelectorAll<HTMLElement>('[data-active=true] p')) {
      expect(text).toBeVisible();
      expect(text.style.clipPath).toBe('');
    }
    await navigate('/transmit');
    expect(active().getByLabelText('별칭')).toHaveValue('LINE_TEST');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('mockup boot and automatic language', () => {
  function expectEntryOnly() {
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /주요 메뉴|Main navigation/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /CRT 화면 효과|CRT display effects/ })).not.toBeInTheDocument();
    expect(document.querySelector('.tm-review')).not.toBeVisible();
    expect(screen.getByText('STANN OS / LIVE')).not.toBeVisible();
    expect(active().queryByRole('link')).not.toBeInTheDocument();
  }

  it.each([
    { languages: ['ja-JP', 'ko-KR', 'en-US'], language: 'ja-JP', expected: 'ko' },
    { languages: ['en-GB', 'ko-KR'], language: 'en-GB', expected: 'en' },
    { languages: ['ja-JP', 'fr-FR'], language: 'ja-JP', expected: 'en' },
    { languages: [], language: 'ko-KR', expected: 'ko' },
  ])('detects supported preferences in order: $languages / $language → $expected', async ({ languages, language, expected }) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
    await navigate('/entry?mode=boot');
    render(<App />);
    expect(document.documentElement.lang).toBe(expected);
    expectEntryOnly();
    expect(active().getByRole('button', { name: /^(터미널 입장|ENTER TERMINAL)$/ })).toBeEnabled();
    expect(active().queryByRole('button', { name: /한국어|English/ })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('completes the boot, returns to the same shell, and shows IDLE on the next entry without pinning automatic language', async () => {
    const user = userEvent.setup();
    await navigate('/entry');
    const first = render(<App />);
    expect(active().getByText('브라우저 언어 자동 감지')).toBeInTheDocument();
    expectEntryOnly();
    const shell = document.querySelector('.tm-shell');
    await user.click(active().getByRole('button', { name: /^(터미널 입장|ENTER TERMINAL)$/ }));
    await waitFor(() => expect(active().getByRole('link', { name: /아카이브 보기/ })).toBeInTheDocument());
    expect(document.querySelector('.tm-shell')).toBe(shell);
    expect(screen.getByRole('banner')).toBeVisible();
    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeVisible();
    expect(screen.getByRole('contentinfo')).toBeVisible();
    expect(document.querySelector('.tm-review')).toBeVisible();
    expect(active().getByRole('heading', { level: 1 })).toHaveFocus();
    expect(JSON.parse(window.localStorage.getItem(ENTRY_VISIT_KEY)!)).toEqual({ visited: true });
    first.unmount();
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);
    await navigate('/entry');
    render(<App />);
    expect(active().getByRole('region', { name: 'Idle screen' })).toBeInTheDocument();
    expectEntryOnly();
    expect(active().getByRole('timer')).toHaveTextContent(/\d{2}:\d{2}:\d{2}/);
    await user.click(active().getByRole('button', { name: 'Return to events' }));
    await waitFor(() => expect(active().getByRole('link', { name: /View archive/ })).toBeInTheDocument());
  });

  it('prioritizes an explicit language choice over browser preferences and preserves it on reload', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(screen.getByRole('button', { name: '영어로 보기' }));
    await navigate('/entry?mode=boot');
    expectEntryOnly();
    expect(active().getByText('Your saved language')).toBeInTheDocument();
    first.unmount();
    render(<App />);
    expect(document.documentElement.lang).toBe('en');
    expect(active().getByText('Your saved language')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(ENTRY_VISIT_KEY)!)).toEqual({ visited: false, lang: 'en' });
  });

  it('continues with tab memory when browser storage is blocked', async () => {
    chooseEntryLanguage('ko');
    completeEntryVisit();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    await navigate('/entry');
    render(<App />);
    expect(active().getByRole('region', { name: '대기 화면' })).toBeInTheDocument();
    fireEvent.click(active().getByRole('button', { name: '이벤트로 돌아가기' }));
    await waitFor(() => expect(active().getByRole('link', { name: /아카이브 보기/ })).toBeInTheDocument());
  });

  it('plays through the boot without a language gate, waits for ENTER, and can replay or skip', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ media: query, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await navigate('/entry?mode=boot');
    render(<App />);
    expect(active().getByRole('button', { name: '애니메이션 건너뛰기' })).toBeEnabled();
    const readout = active().getByLabelText('부팅 출력');
    expectEntryOnly();
    await waitFor(() => expect(active().getByRole('button', { name: /^(터미널 입장|ENTER TERMINAL)$/ })).toBeEnabled(), { timeout: 4000 });
    expect(window.location.hash).toBe('#/entry?mode=boot');
    expect(active().getAllByRole('button')).toHaveLength(1);
    expect(active().getByRole('button', { name: '터미널 입장' })).toHaveFocus();
    expect(active().getByLabelText('부팅 출력')).toBe(readout);
    expect(readout).toBeVisible();
    expect(within(readout).getByText('PUBLIC GUESTBOOK')).toBeVisible();
    expectEntryOnly();
    fireEvent.click(active().getByRole('button', { name: /^(터미널 입장|ENTER TERMINAL)$/ }));
    await waitFor(() => expect(active().getByRole('link', { name: /아카이브 보기/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '부팅 다시 보기' }));
    await waitFor(() => expect(active().getByRole('button', { name: '애니메이션 건너뛰기' })).toBeEnabled());
    expect(active().queryByRole('button', { name: /^(터미널 입장|ENTER TERMINAL)$/ })).not.toBeInTheDocument();
    fireEvent.click(active().getByRole('button', { name: '애니메이션 건너뛰기' }));
    expect(active().getByRole('button', { name: /^(터미널 입장|ENTER TERMINAL)$/ })).toBeEnabled();
    expect(active().getByText('브라우저 언어 자동 감지')).toBeInTheDocument();
    expectEntryOnly();
  });

  it('finishes a backgrounded boot without entering or restarting it when the document returns', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ media: query, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }));
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await navigate('/entry?mode=boot');
    render(<App />);
    expect(active().getByRole('button', { name: '애니메이션 건너뛰기' })).toBeEnabled();
    visibility.mockReturnValue('hidden');
    fireEvent(document, new Event('visibilitychange'));
    const enter = active().getByRole('button', { name: '터미널 입장' });
    expect(enter).toBeEnabled();
    expect(enter).not.toHaveFocus();
    visibility.mockReturnValue('visible');
    fireEvent(document, new Event('visibilitychange'));
    expect(active().getByRole('button', { name: '터미널 입장' })).toBe(enter);
    expect(active().queryByRole('button', { name: '애니메이션 건너뛰기' })).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#/entry?mode=boot');
    expect(window.localStorage.getItem(ENTRY_VISIT_KEY)).toBeNull();
    expectEntryOnly();
  });

  it('respects CRT OFF, requires explicit entry after skipping, and preserves the draft', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ media: query, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await navigate('/signal');
    render(<App />);
    await user.type(active().getByLabelText('이메일'), 'draft@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'CRT 화면 효과' }));
    expect(document.querySelector('.tm-glass')).not.toBeInTheDocument();
    expect(screen.getByRole('main').closest('.tm-shell')).toHaveAttribute('data-crt', 'false');
    await navigate('/entry?mode=boot');
    expect(active().getByRole('button', { name: /^(터미널 입장|ENTER TERMINAL)$/ })).toBeEnabled();
    expectEntryOnly();
    await navigate('/signal');
    fireEvent.click(screen.getByRole('button', { name: 'CRT 화면 효과' }));
    expect(document.querySelector('.tm-glass')).toHaveAttribute('aria-hidden', 'true');
    await navigate('/entry?mode=boot');
    expect(active().getByRole('button', { name: '애니메이션 건너뛰기' })).toBeEnabled();
    await user.click(active().getByRole('button', { name: '애니메이션 건너뛰기' }));
    expect(window.location.hash).toBe('#/entry?mode=boot');
    expect(active().getAllByRole('button')).toHaveLength(1);
    expect(active().getByRole('button', { name: '터미널 입장' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(active().getByRole('link', { name: /아카이브 보기/ })).toBeInTheDocument());
    expect(JSON.parse(window.localStorage.getItem(ENTRY_VISIT_KEY)!)).toEqual({ visited: true });
    await navigate('/signal');
    expect(active().getByLabelText('이메일')).toHaveValue('draft@example.com');
    expect(fetch).not.toHaveBeenCalled();
  });
});
