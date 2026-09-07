import { useState } from 'react';
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TerminalButton from '../components/TerminalButton';
import ConsentCheckbox from '../components/ui/ConsentCheckbox';
import { useFieldErrors } from '../components/ui/useFieldErrors';
import { useUrlQueryState } from '../lib/useUrlQueryState';
import { useTransmit } from '../app/transmit/useTransmit';
import { useEventClock } from '../lib/events/useEventClock';
import { getEffectiveEventStatus, getRequestWindowState } from '../lib/events/lifecycle';
import type { TerminalEvent } from '../lib/events/types';

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
