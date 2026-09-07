const LANG_KEY = 'terminal_lang';
export type Lang = 'ko' | 'en';
let memoryLang: Lang = 'ko';
let isStorageUnavailable = false;

export function parseLang(value: unknown): Lang {
  return value === 'en' ? 'en' : 'ko';
}

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'ko';
  if (!isStorageUnavailable) {
    try {
      memoryLang = parseLang(window.localStorage.getItem(LANG_KEY));
    } catch {
      isStorageUnavailable = true;
    }
  }
  return memoryLang;
}

export function setLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  memoryLang = parseLang(lang);
  if (isStorageUnavailable) return;
  try {
    window.localStorage.setItem(LANG_KEY, memoryLang);
  } catch {
    isStorageUnavailable = true;
  }
}
