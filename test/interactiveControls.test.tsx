import { useState } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
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
import ArtistRow from '../app/lineup/ArtistRow';
import LineupPage from '../app/lineup/page';
import { LangProvider } from '../lib/langContext';
import LangToggle from '../components/ui/LangToggle';
import GatePage from '../app/gate/page';
import StatusPage from '../app/status/page';
import SleepScreen from '../app/_entry/SleepScreen';

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

  it('keeps accordion content mounted through keyboard toggles and language changes, restoring internal focus on close', async () => {
    const user = userEvent.setup();
    render(<LangProvider><ArtistRow artist={artist} /><LangToggle /></LangProvider>);
    const trigger = screen.getByRole('button', { name: /ARTIST ONE/ });
    const details = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    const biography = screen.getByText('아티스트의 긴 한국어 소개입니다.');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(details).toHaveAttribute('aria-hidden', 'true');
    expect(details).toHaveAttribute('inert');

    await user.tab();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(details).not.toHaveAttribute('inert');
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('아티스트의 긴 한국어 소개입니다.')).toBe(biography);
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('A longer artist biography in English.')).toBe(biography);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Rich description content can own focus when a close is dispatched elsewhere.
    biography.tabIndex = 0;
    biography.focus();
    fireEvent.click(trigger);
    expect(trigger).toHaveFocus();
    expect(details).toHaveAttribute('aria-hidden', 'true');
    expect(details).toHaveAttribute('inert');
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
    window.history.replaceState(null, '', '/lineup?lang=ko&event=archive');
    const user = userEvent.setup();
    render(<QueryClientProvider client={queryClient}><LineupPage /></QueryClientProvider>);

    expect(screen.getByRole('heading', { name: 'Archived event' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이벤트 보기' })).toHaveAttribute('href', '/gate?event=archive');
    await user.selectOptions(screen.getByRole('combobox', { name: '이벤트 선택' }), 'live');
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
    expect(screen.queryByRole('link', { name: /게스트 신청/ })).not.toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: /RESUME SESSION/ })).toHaveFocus();
    expect(onWake).not.toHaveBeenCalled();
    await user.keyboard('{Enter}{Enter}');
    fireEvent.click(screen.getByRole('button', { name: /RESUME SESSION/ }));
    await waitFor(() => expect(onWake).toHaveBeenCalledTimes(1));
  });
});
