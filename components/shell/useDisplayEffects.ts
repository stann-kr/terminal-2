'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'terminal_crt_enabled';
const listeners = new Set<() => void>();
let memoryPreference: boolean | undefined;

function getSnapshot() {
  // A failed write must still keep the user's choice across page navigation.
  if (memoryPreference !== undefined) return memoryPreference;
  try { return window.localStorage.getItem(STORAGE_KEY) !== 'false'; }
  catch { return true; }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    memoryPreference = undefined;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function toggleEffects() {
  memoryPreference = !getSnapshot();
  try {
    window.localStorage.setItem(STORAGE_KEY, String(memoryPreference));
    memoryPreference = undefined;
  } catch { /* Keep this tab's preference when storage is unavailable. */ }
  listeners.forEach(listener => listener());
}

// Hydration starts with an unobscured display, then restores the preference.
const getServerSnapshot = () => false;

export function useDisplayEffects() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { enabled, toggleEffects };
}
