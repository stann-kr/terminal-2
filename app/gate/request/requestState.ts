import { getFutureUpcomingEvent, getRequestWindowState, type RequestWindowState } from '@/lib/events/lifecycle';
import type { TerminalEvent } from '@/lib/events/types';

export type RequestEventState =
  | { kind: 'loading' }
  | { kind: 'load-error' }
  | { kind: 'empty' }
  | { kind: 'target-changed'; event: TerminalEvent | null; nextEvent: TerminalEvent | null }
  | { kind: 'inactive'; event: TerminalEvent; window: RequestWindowState }
  | { kind: 'ready'; event: TerminalEvent };

export type CodeVerificationState =
  | { kind: 'idle' }
  | { kind: 'verifying' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }
  | { kind: 'target-changed' }
  | { kind: 'verified'; artistName: string };

export function resolveRequestEventState(
  events: TerminalEvent[],
  accessWindowDays: number,
  now: Date = new Date(),
  requestedEventId?: string,
): Exclude<RequestEventState, { kind: 'loading' } | { kind: 'load-error' }> {
  const event = getFutureUpcomingEvent(events, now);
  if (requestedEventId && event?.id !== requestedEventId) {
    return {
      kind: 'target-changed',
      event: events.find(candidate => candidate.id === requestedEventId) ?? null,
      nextEvent: event,
    };
  }
  if (!event) return { kind: 'empty' };

  const window = getRequestWindowState(event, accessWindowDays, now);
  return window.isActive
    ? { kind: 'ready', event }
    : { kind: 'inactive', event, window };
}

export function resolveCodeVerificationState(
  response: { ok: boolean; status: number; name?: string | null; error?: string },
): Exclude<CodeVerificationState, { kind: 'idle' } | { kind: 'verifying' }> {
  if (!response.ok) {
    if (response.error === 'EVENT_MISMATCH' || response.error === 'EVENT_ID_REQUIRED'
      || response.error === 'NO_UPCOMING_EVENT') {
      return { kind: 'target-changed' };
    }
    return response.status === 400 ? { kind: 'invalid' } : { kind: 'unavailable' };
  }

  return response.name ? { kind: 'verified', artistName: response.name } : { kind: 'invalid' };
}
