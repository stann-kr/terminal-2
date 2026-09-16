import type { Lang } from '../events/data';

export const ENTRY_VISIT_KEY = 'terminal_aspen_preview_entry_v1';
interface EntryVisit { visited: boolean; lang?: Lang }
let memoryVisit: EntryVisit = { visited: false };

export function detectBrowserLanguage(): { lang: Lang; origin: 'browser' | 'fallback' } {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of languages) {
    const language = locale?.toLowerCase().split(/[-_]/)[0];
    if (language === 'ko' || language === 'en') return { lang: language, origin: 'browser' };
  }
  return { lang: 'en', origin: 'fallback' };
}

export function readEntryVisit(): EntryVisit {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(ENTRY_VISIT_KEY);
  } catch {
    // The standalone file can run on an origin where storage is unavailable.
    return memoryVisit;
  }
  if (!raw) return { visited: false };
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && 'visited' in value && typeof value.visited === 'boolean') {
      memoryVisit = { visited: value.visited, ...('lang' in value && (value.lang === 'ko' || value.lang === 'en') ? { lang: value.lang } : {}) };
      return memoryVisit;
    }
    return { visited: false };
  } catch {
    return { visited: false };
  }
}

function saveVisit(visit: EntryVisit) {
  memoryVisit = visit;
  try { window.localStorage.setItem(ENTRY_VISIT_KEY, JSON.stringify(memoryVisit)); } catch { /* Tab memory remains usable. */ }
}

export function chooseEntryLanguage(lang: Lang) {
  saveVisit({ ...readEntryVisit(), lang });
}

export function completeEntryVisit() {
  saveVisit({ ...readEntryVisit(), visited: true });
}
