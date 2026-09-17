const LANG_KEY = 'terminal_lang';
export type Lang = 'ko' | 'en';
let memoryLang: Lang = 'ko';
let isStorageUnavailable = false;

export function parseLang(value: unknown): Lang {
  return value === 'en' ? 'en' : 'ko';
}

export function getLang({ detectBrowser = false }: { detectBrowser?: boolean } = {}): Lang {
  if (typeof window === 'undefined') return 'ko';
  if (!isStorageUnavailable) {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored === 'ko' || stored === 'en' || !detectBrowser) memoryLang = parseLang(stored);
      else {
        const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
        memoryLang = languages.map(locale => locale.toLowerCase().split(/[-_]/)[0])
          .find((language): language is Lang => language === 'ko' || language === 'en') ?? 'en';
      }
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
