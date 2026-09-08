import { useState } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TerminalButton from '../components/TerminalButton';
import ConsentCheckbox from '../components/ui/ConsentCheckbox';
import { useFieldErrors } from '../components/ui/useFieldErrors';
import { useUrlQueryState } from '../lib/useUrlQueryState';
import { useTransmit } from '../app/transmit/useTransmit';
import { useEventClock } from '../lib/events/useEventClock';
import { getEffectiveEventStatus, getRequestWindowState } from '../lib/events/lifecycle';
import type { Artist, TerminalEvent } from '../lib/events/types';
import { eventKeys } from '../lib/events/client';
import LineupPage from '../app/lineup/page';
import { LangProvider } from '../lib/langContext';
import GatePage from '../app/gate/page';
import StatusPage from '../app/status/page';
import SleepScreen from '../app/_entry/SleepScreen';
import BootSequence from '../app/_entry/BootSequence';
import DecodeText from '../components/DecodeText';
import AnimatedHeight from '../components/ui/AnimatedHeight';
import HomeMasthead from '../app/home/HomeMasthead';
import TerminalNavigation from '../components/shell/TerminalNavigation';
import EventSummary from '../components/events/EventSummary';
import HomePage from '../app/home/page';
import SignalPage from '../app/signal/page';
import { gsap, ScrollTrigger } from '../lib/motion/gsap';

afterEach(cleanup);

function QueryHarness() {
  const [event, setEvent] = useUrlQueryState('event');
  return <button onClick={() => setEvent('TRM-02')}>{event || 'NONE'}</button>;
}

function FieldErrorHarness() {
  const { showFieldErrors } = useFieldErrors<'email' | 'message'>('test');

  return (
    <div>
      <input id="test-email" aria-label="Email" />
      <input id="test-message" aria-label="Message" />
      <button type="button" onClick={() => showFieldErrors({ email: 'Required', message: 'Required' })}>
        Validate
      </button>
    </div>
  );
}

describe('interactive control behavior', () => {
  it('selects the request directory precisely and returns focus when the expanded menu closes', async () => {
    const user = userEvent.setup();
    render(<TerminalNavigation pathname="/gate/request" />);
    const navigation = within(screen.getByRole('navigation', { name: '주요 메뉴' }));
    expect(navigation.getByRole('link', { name: '게스트 신청' })).toHaveAttribute('aria-current', 'page');
    expect(navigation.getByRole('link', { name: '이벤트' })).not.toHaveAttribute('aria-current');
    const toggle = screen.getByRole('button', { name: /메뉴/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    navigation.getByRole('link', { name: '소식 신청' }).focus();
    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('activates the shared button with keyboard input', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [count, setCount] = useState(0);
      return <TerminalButton onClick={() => setCount((value) => value + 1)}>COUNT {count}</TerminalButton>;
    };
    render(<Harness />);

    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'COUNT 1' })).toHaveClass('min-h-11');
  });

  it('forwards native ARIA state to the shared button element', () => {
    render(
      <TerminalButton aria-pressed aria-controls="event-view">
        UPCOMING
      </TerminalButton>,
    );

    const button = screen.getByRole('button', { name: 'UPCOMING' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-controls', 'event-view');
  });

  it('uses the checkbox label as a full click target', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [checked, setChecked] = useState(false);
      return (
        <ConsentCheckbox
          id="consent"
          name="consent"
          checked={checked}
          onChange={setChecked}
          label="Privacy consent"
        />
      );
    };
    render(<Harness />);

    await user.click(screen.getByText('Privacy consent'));
    expect(screen.getByRole('checkbox', { name: 'Privacy consent' })).toBeChecked();
  });

  it('updates selector query state without navigating away', async () => {
    window.history.replaceState(null, '', '/lineup?lang=ko');
    const user = userEvent.setup();
    render(<QueryHarness />);

    await user.click(screen.getByRole('button', { name: 'NONE' }));
    expect(screen.getByRole('button', { name: 'TRM-02' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/lineup');
    expect(window.location.search).toBe('?lang=ko&event=TRM-02');
  });

  it('moves focus to the first invalid field after validation', async () => {
    const user = userEvent.setup();
    render(<FieldErrorHarness />);

    await user.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus());
  });
});

describe('brand text motion', () => {
  function advanceMotion(milliseconds: number) {
    act(() => { gsap.globalTimeline.time(gsap.globalTimeline.time() + milliseconds / 1000, false); });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([false, true])('plays once and stays final after a tab return (interrupted: %s)', (interrupted) => {
    const onComplete = vi.fn();
    const props = { speed: 0.9, scramble: 3, step: 2, onComplete };
    const { rerender } = render(<DecodeText as="h1" text="TERMINAL" {...props} />);
    const heading = screen.getByRole('heading', { name: 'TERMINAL' });
    expect(onComplete).not.toHaveBeenCalled();

    advanceMotion(200);
    expect(heading.textContent).not.toBe('TERMINAL');
    expect(heading).toHaveAccessibleName('TERMINAL');
    if (!interrupted) {
      advanceMotion(1_000);
      expect(heading.textContent).toBe('TERMINAL');
      expect(onComplete).toHaveBeenCalledTimes(1);
    }

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(heading.textContent).toBe('TERMINAL');
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    advanceMotion(200);
    expect(heading.textContent).toBe('TERMINAL');
    expect(onComplete).toHaveBeenCalledTimes(1);

    rerender(<DecodeText as="h1" text="READY" {...props} />);
    rerender(<DecodeText as="h1" text="TERMINAL" {...props} />);
    advanceMotion(1_000);
    expect(heading.textContent).toBe('TERMINAL');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('keeps reduced-motion text final through its delay and a content change', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} })));
    const onComplete = vi.fn();
    const { rerender } = render(<DecodeText as="h1" text="TERMINAL" delay={200} onComplete={onComplete} />);
    expect(screen.getByRole('heading', { name: 'TERMINAL' }).textContent).toBe('TERMINAL');
    expect(onComplete).toHaveBeenCalledTimes(1);
    advanceMotion(1_000);
    expect(onComplete).toHaveBeenCalledTimes(1);

    rerender(<DecodeText as="h1" text="READY" delay={200} onComplete={onComplete} />);
    expect(screen.getByRole('heading', { name: 'READY' }).textContent).toBe('READY');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('keeps markup literal during scrambling and stops callbacks on unmount', () => {
    const text = '<img src=x onerror=alert(1)> & TERMINAL';
    const onComplete = vi.fn();
    const { unmount, rerender } = render(<DecodeText as="h1" text={text} onComplete={onComplete} />);
    const heading = screen.getByRole('heading', { name: text });
    advanceMotion(1_000);
    expect(heading.children).toHaveLength(0);
    expect(heading).toHaveAccessibleName(text);
    advanceMotion(1_500);
    expect(heading.textContent).toBe(text);
    expect(heading.children).toHaveLength(0);
    expect(onComplete).toHaveBeenCalledOnce();
    rerender(<DecodeText as="h1" text="READY" onComplete={onComplete} />);
    unmount();
    advanceMotion(3_000);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('releases a scene\'s scroll triggers when it unmounts', () => {
    const before = ScrollTrigger.getAll();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { unmount } = render(<HomeMasthead />);
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(before.length);
    unmount();
    expect(ScrollTrigger.getAll()).toEqual(before);
  });

  it('reverses an accordion from its current height and settles on resized content', () => {
    let notifyResize!: () => void;
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { notifyResize = callback; }
      observe() {}
      disconnect = disconnect;
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(120);
    const { container, rerender, unmount } = render(<AnimatedHeight show={false}><p>Details</p></AnimatedHeight>);
    const outer = container.firstElementChild as HTMLElement;
    rerender(<AnimatedHeight show><p>Details</p></AnimatedHeight>);
    advanceMotion(100);
    const openingHeight = parseFloat(outer.style.height);
    expect(openingHeight).toBeGreaterThan(0);
    expect(openingHeight).toBeLessThan(120);
    rerender(<AnimatedHeight show={false}><p>Details</p></AnimatedHeight>);
    advanceMotion(100);
    expect(parseFloat(outer.style.height)).toBeLessThan(openingHeight);
    expect(outer).toHaveAttribute('inert');
    rerender(<AnimatedHeight show><p>Details</p></AnimatedHeight>);
    measure.mockReturnValue(180);
    act(() => notifyResize());
    advanceMotion(1_000);
    expect(outer.style.height).toBe('180px');
    expect(outer).not.toHaveAttribute('inert');
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});

function TransmitHarness() {
  const transmit = useTransmit();
  return (
    <form onSubmit={transmit.handleSubmit}>
      <input aria-label="Alias" value={transmit.handle} onChange={transmit.handleHandleChange} />
      <textarea aria-label="Message" value={transmit.message} onChange={transmit.handleMessageChange} />
      <button type="submit" disabled={transmit.isSubmitting}>Post message</button>
      {transmit.formError && <p role="alert">{transmit.formError}</p>}
      {transmit.sent && <p role="status">Submitted message posted</p>}
    </form>
  );
}

describe('Transmit draft submission', () => {
  afterEach(() => vi.restoreAllMocks());

  const postedEntry = { id: 'post-1', handle: 'NODE', message: 'Hello', ts: '', createdAt: '2026-09-08T00:00:00Z' };
  const emptyPage = { logs: [], total: 0, page: 1, totalPages: 1 };

  function renderTransmit() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    return render(<QueryClientProvider client={queryClient}><TransmitHarness /></QueryClientProvider>);
  }

  it('preserves a draft edited during a delayed submission and gives it a new idempotency key', async () => {
    const submittedKeys: string[] = [];
    let completeSubmission!: (response: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      if (init?.method !== 'POST') return Response.json(emptyPage);
      submittedKeys.push(new Headers(init.headers).get('Idempotency-Key')!);
      if (submittedKeys.length === 1) return new Promise<Response>((resolve) => { completeSubmission = resolve; });
      return Response.json(postedEntry);
    });
    const user = userEvent.setup();
    renderTransmit();
    const message = screen.getByRole('textbox', { name: 'Message' });
    await user.type(message, 'Hello');
    await user.click(screen.getByRole('button', { name: 'Post message' }));
    await waitFor(() => expect(submittedKeys).toHaveLength(1));

    // Even an edit that leaves the normalized payload unchanged is a new draft.
    await user.type(message, ' ');
    await act(async () => completeSubmission(Response.json(postedEntry)));
    await screen.findByRole('status');
    expect(message).toHaveValue('Hello ');

    await user.click(screen.getByRole('button', { name: 'Post message' }));
    await waitFor(() => expect(message).toHaveValue(''));
    expect(submittedKeys).toHaveLength(2);
    expect(submittedKeys[1]).not.toBe(submittedKeys[0]);
  });

  it('retries an unchanged failed submission with the same idempotency key', async () => {
    const submittedKeys: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      if (init?.method !== 'POST') return Response.json(emptyPage);
      submittedKeys.push(new Headers(init.headers).get('Idempotency-Key')!);
      return submittedKeys.length === 1
        ? Response.json({ error: 'FAILED' }, { status: 500 })
        : Response.json(postedEntry);
    });
    const user = userEvent.setup();
    renderTransmit();
    const message = screen.getByRole('textbox', { name: 'Message' });
    await user.type(message, 'Hello');
    await user.click(screen.getByRole('button', { name: 'Post message' }));
    await screen.findByRole('alert');
    expect(message).toHaveValue('Hello');

    await user.click(screen.getByRole('button', { name: 'Post message' }));
    await waitFor(() => expect(message).toHaveValue(''));
    expect(submittedKeys).toHaveLength(2);
    expect(submittedKeys[1]).toBe(submittedKeys[0]);
  });
});

describe('event clock policy updates', () => {
  const event: TerminalEvent = {
    id: 'clock-event', session: 'Clock event', subtitle: 'Test',
    date: '2026-09-10', time: '12:00 KST', status: 'UPCOMING',
    venue: 'Venue', district: 'District', coords: '0,0', capacity: '100', sound: 'System', artists: [],
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens requests and archives a started event at their boundaries without ticking between them', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T11:59:59+09:00'));
    const { result } = renderHook(() => useEventClock([event], 30));
    act(() => vi.advanceTimersByTime(0));
    expect(getRequestWindowState(event, 30, result.current).isActive).toBe(false);

    act(() => vi.advanceTimersByTime(1_000));
    expect(getRequestWindowState(event, 30, result.current).isActive).toBe(true);
    const openedAt = result.current;
    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current).toBe(openedAt);

    act(() => vi.advanceTimersByTime(30 * 86_400_000 - 5_000));
    expect(getEffectiveEventStatus(event, result.current)).toBe('ARCHIVED');
    expect(getRequestWindowState(event, 30, result.current).isActive).toBe(false);
  });

  it('recalculates an elapsed event when a background document becomes visible', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T11:59:59+09:00'));
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const { result } = renderHook(() => useEventClock([event], 30));
    act(() => vi.advanceTimersByTime(0));

    vi.setSystemTime(new Date('2026-09-10T12:01:00+09:00'));
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(getEffectiveEventStatus(event, result.current)).toBe('UPCOMING');

    visibility.mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(getEffectiveEventStatus(event, result.current)).toBe('ARCHIVED');
    expect(getRequestWindowState(event, 30, result.current).isActive).toBe(false);
  });
});

describe('lineup controls', () => {
  const artist: Artist = {
    id: 'artist-1', name: 'ARTIST ONE', origin: 'KR', dock: '1', time: '23:00–00:00', status: 'CONFIRMED',
    description: { ko: '아티스트의 긴 한국어 소개입니다.', en: 'A longer artist biography in English.' },
  };

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    })));
    localStorage.setItem('terminal_lang', 'ko');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('selects a profile by keyboard, preserves language selection and restores roster focus', async () => {
    const event: TerminalEvent = {
      id: 'live', session: 'Live event', subtitle: 'Test', date: '2026-09-08', time: '23:00 KST', status: 'LIVE',
      venue: 'Venue', district: 'District', coords: '0,0', capacity: '100', sound: 'System', artists: [artist],
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(eventKeys.list(), [event]);
    window.history.replaceState(null, '', '/lineup?event=live');
    const user = userEvent.setup();
    render(<LangProvider><QueryClientProvider client={queryClient}><LineupPage /></QueryClientProvider></LangProvider>);
    const trigger = screen.getByRole('button', { name: /ARTIST ONE/ });
    expect(trigger).toHaveAttribute('aria-pressed', 'false');
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'ARTIST ONE' })).toHaveFocus();
    expect(window.location.search).toBe('?event=live&artist=artist-1');
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('A longer artist biography in English.')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-pressed', 'false');
    expect(window.location.search).toBe('?event=live');
    act(() => {
      window.history.replaceState(null, '', '/lineup?event=live&artist=artist-1');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { name: 'ARTIST ONE' })).toBeInTheDocument();
    act(() => {
      window.history.replaceState(null, '', '/lineup?event=live&artist=missing');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.queryByRole('heading', { name: 'ARTIST ONE' })).not.toBeInTheDocument();
    expect(screen.getByText(/This artist is not in this event/)).toBeInTheDocument();
  });

  it('honors the event URL and immediately replaces the lineup and Gate link on selection', async () => {
    const baseEvent: TerminalEvent = {
      id: 'live', session: 'Live event', subtitle: 'Test', date: '2026-09-08', time: '23:00 KST', status: 'LIVE',
      venue: 'Venue', district: 'District', coords: '0,0', capacity: '100', sound: 'System',
      artists: [{ ...artist, name: 'LIVE ARTIST', description: undefined }],
    };
    const archived: TerminalEvent = {
      ...baseEvent, id: 'archive', session: 'Archived event', date: '2025-09-08', status: 'ARCHIVED',
      artists: [{ ...artist, name: 'ARCHIVE ARTIST', description: undefined }],
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false } } });
    queryClient.setQueryData(eventKeys.list(), [baseEvent, archived]);
    window.history.replaceState(null, '', '/lineup?lang=ko&event=archive&artist=artist-1');
    const user = userEvent.setup();
    render(<QueryClientProvider client={queryClient}><LineupPage /></QueryClientProvider>);

    expect(screen.getByRole('heading', { name: 'Archived event' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이벤트 보기' })).toHaveAttribute('href', '/gate?event=archive');
    const push = vi.spyOn(window.history, 'pushState');
    await user.selectOptions(screen.getByRole('combobox', { name: '이벤트 선택' }), 'live');
    expect(push).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Live event' })).toBeInTheDocument();
    expect(screen.getByText('LIVE ARTIST')).toBeInTheDocument();
    expect(screen.queryByText('ARCHIVE ARTIST')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이벤트 보기' })).toHaveAttribute('href', '/gate?event=live');
    expect(window.location.search).toBe('?lang=ko&event=live');

    act(() => {
      window.history.replaceState(null, '', '/lineup?lang=ko&event=missing');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('combobox', { name: '이벤트 선택' })).toHaveValue('live');
    expect(screen.getByText('LIVE ARTIST')).toBeInTheDocument();
  });
});

describe('event page states and optional entry', () => {
  const event: TerminalEvent = {
    id: 'next', session: 'Next event', subtitle: 'Test', date: '2099-09-08', time: '23:00 KST', status: 'UPCOMING',
    venue: 'Venue', district: 'District', coords: '0,0', capacity: '100', sound: 'System', artists: [],
  };
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('keeps the real event information available when its poster fails', () => {
    render(<EventSummary event={{ ...event, posterUrl: '/missing-poster.png' }} />);
    fireEvent.error(screen.getByRole('img', { name: 'Next event 포스터' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('공개된 포스터가 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next event' })).toBeInTheDocument();
  });

  it.each(['UPCOMING', 'ARCHIVED'] as const)('connects the Home event to its correct %s destination', (status) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(eventKeys.list(), [{ ...event, status }]);
    render(<QueryClientProvider client={queryClient}><HomePage /></QueryClientProvider>);
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Next event' })).toBeInTheDocument();
    expect(main.querySelector('a[href^="/gate?"]')).toHaveAttribute('href', status === 'ARCHIVED' ? '/gate?view=archive&event=next' : '/gate?event=next');
  });

  it('distinguishes loading, failure and a confirmed empty event registry', async () => {
    let complete!: (response: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    render(<QueryClientProvider client={queryClient}><StatusPage /></QueryClientProvider>);
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
    expect(screen.queryByText('지난 이벤트 기준')).not.toBeInTheDocument();
    await act(async () => complete(Response.json({}, { status: 500 })));
    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했습니다');
    expect(screen.queryByText('지난 이벤트 기준')).not.toBeInTheDocument();
    act(() => { queryClient.setQueryData(eventKeys.list(), []); });
    expect(await screen.findAllByText('0')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('기록된 이벤트가 없습니다');
  });

  it('hides requests before opening and changes Gate view with one history entry', () => {
    const archived = { ...event, id: 'old', session: 'Past event', status: 'ARCHIVED' as const };
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(eventKeys.list(), [event, archived]);
    window.history.replaceState(null, '', '/gate?view=archive&event=old&lang=ko');
    render(<QueryClientProvider client={queryClient}><GatePage /></QueryClientProvider>);
    const push = vi.spyOn(window.history, 'pushState');
    fireEvent.click(screen.getByRole('button', { name: '진행 중·예정' }));
    expect(push).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe('?view=upcoming&lang=ko');
    expect(screen.getByRole('heading', { name: 'Next event' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).queryByRole('link', { name: /게스트 신청/ })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('신청 시작:');
    act(() => {
      window.history.replaceState(null, '', '/gate?view=archive&event=old&lang=ko');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { name: 'Past event' })).toBeInTheDocument();
  });

  it.each([true, false])('resumes exactly once after explicit activation (reduced motion: %s)', async (reduce) => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduce, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })));
    const onWake = vi.fn();
    const user = userEvent.setup();
    render(<SleepScreen onWake={onWake} />);
    await user.tab();
    expect(screen.getByRole('button', { name: '이벤트로 돌아가기' })).toHaveFocus();
    expect(onWake).not.toHaveBeenCalled();
    await user.keyboard('{Enter}{Enter}');
    fireEvent.click(screen.getByRole('button', { name: '이벤트로 돌아가기' }));
    await waitFor(() => expect(onWake).toHaveBeenCalledTimes(1));
  });

  it('skips Boot only through its control, keeps language choice explicit and enters once', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })));
    localStorage.setItem('terminal_lang', 'ko');
    const onComplete = vi.fn();
    const { unmount } = render(<LangProvider><BootSequence onComplete={onComplete} /></LangProvider>);
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.queryByRole('button', { name: /한국어/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '애니메이션 건너뛰기' }));
    expect(screen.getByRole('button', { name: /한국어/ })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /English/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip animation' }));
    const enter = screen.getByRole('button', { name: /ENTER TERMINAL/ });
    fireEvent.click(enter);
    fireEvent.click(enter);
    expect(onComplete).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('Signal form results', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('preserves contact details on a duplicate response and announces only a confirmed save', async () => {
    localStorage.setItem('terminal_lang', 'ko');
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ error: 'EMAIL_ALREADY_SUBSCRIBED' }, { status: 409 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    const user = userEvent.setup();
    render(<LangProvider><SignalPage /></LangProvider>);
    await user.type(screen.getByRole('textbox', { name: '이메일:' }), 'guest@example.com');
    await user.type(screen.getByRole('textbox', { name: '인스타그램 ID:' }), 'guest');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '소식 신청' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 구독 중인 이메일입니다.');
    expect(screen.getByRole('textbox', { name: '이메일:' })).toHaveValue('guest@example.com');
    expect(screen.queryByRole('heading', { name: '소식 신청을 저장했습니다.' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '소식 신청' }));
    expect(await screen.findByRole('heading', { name: '소식 신청을 저장했습니다.' })).toHaveFocus();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/signal', '/api/signal']);
  });
});
