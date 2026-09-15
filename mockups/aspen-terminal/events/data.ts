import snapshot from './snapshot.json';
import { getEffectiveEventStatus } from '../../../lib/events/lifecycle';
import type { Artist, TerminalEvent } from '../../../lib/events/types';

export type Lang = 'ko' | 'en';
export type Scenario = 'snapshot' | 'upcoming' | 'live' | 'empty' | 'error' | 'long';
export type Page = 'home' | 'gate' | 'lineup' | 'request' | 'status' | 'transmit' | 'signal' | 'about' | 'link';
export type Translate = (ko: string, en: string) => string;
export const SNAPSHOT_AT = new Date('2026-09-15T23:11:00+09:00');
export const eventsSnapshot = snapshot as TerminalEvent[];
export const scenarioClock = (scenario: Scenario) => scenario === 'upcoming' ? new Date('2026-05-01T23:00:00+09:00') : SNAPSHOT_AT;

export function getPreviewEvents(scenario: Scenario): TerminalEvent[] {
  if (scenario === 'empty') return [];
  return eventsSnapshot.map((event, index) => ({
    ...event,
    status: scenario === 'live' && index === 0 ? 'LIVE' : getEffectiveEventStatus(event, scenarioClock(scenario)),
    ...(scenario === 'long' && index === 0 ? { session: 'TERMINAL [02] / HELIOPAUSE OUTSKIRTS', subtitle: '태양계 최외곽에서 이어지는 길고 짙은 사운드의 기록 / Long title layout sample' } : {}),
  }));
}

export function isPublicArtist(artist: Artist) {
  return artist.status === 'CONFIRMED' || artist.status === 'ARCHIVED';
}

export function biography(artist: Artist, lang: Lang): string[] {
  const source = artist.description;
  const text = typeof source === 'object' && !Array.isArray(source) ? source[lang] : source;
  return (Array.isArray(text) ? text : text?.split('\n') ?? []).filter(line => line.trim());
}

export const pagePaths: Record<Page, string> = { home: '/home', gate: '/gate', lineup: '/lineup', request: '/gate/request', status: '/status', transmit: '/transmit', signal: '/signal', about: '/about', link: '/link' };
export function href(page: Page, event?: string, artist?: string) {
  const query = new URLSearchParams();
  if (event) query.set('event', event);
  if (artist) query.set('artist', artist);
  return `#${pagePaths[page]}${query.size ? `?${query}` : ''}`;
}

export function readLocation() {
  const [path, search = ''] = window.location.hash.slice(1).split('?');
  const page = (Object.keys(pagePaths) as Page[]).find(key => pagePaths[key] === path) ?? 'home';
  const params = new URLSearchParams(search);
  return { page, eventId: params.get('event'), artistId: params.get('artist') };
}

export interface ScreenProps {
  lang: Lang;
  t: Translate;
  event: TerminalEvent | null;
  events: TerminalEvent[];
  scenario: Scenario;
}
