const VISIT_KEY = 'terminal_visited';
let memoryVisited = false;
let isStorageUnavailable = false;

export function hasVisited(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isStorageUnavailable) {
    try {
      memoryVisited = window.localStorage.getItem(VISIT_KEY) === 'true';
    } catch {
      isStorageUnavailable = true;
    }
  }
  return memoryVisited;
}

export function markVisited(): void {
  if (typeof window === 'undefined') return;
  memoryVisited = true;
  if (isStorageUnavailable) return;
  try {
    window.localStorage.setItem(VISIT_KEY, 'true');
  } catch {
    isStorageUnavailable = true;
  }
}
