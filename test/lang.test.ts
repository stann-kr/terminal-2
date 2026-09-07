import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseLang } from '../lib/lang';

describe('language persistence contract', () => {
  it('accepts only supported language values', () => {
    expect(parseLang('ko')).toBe('ko');
    expect(parseLang('en')).toBe('en');
  });

  it.each([null, undefined, '', 'EN', 'ja', 1, {}])('falls back to Korean for invalid value %j', (value) => {
    expect(parseLang(value)).toBe('ko');
  });
});

describe('optional browser storage resilience', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['access', 'read', 'write'])('keeps client preferences in memory when storage %s fails', async (failure) => {
    vi.resetModules();
    const storage = {
      getItem: () => {
        if (failure === 'read') throw new Error('Storage unavailable');
        return null;
      },
      setItem: () => { throw new Error('Storage unavailable'); },
    };
    vi.stubGlobal('window', {
      get localStorage() {
        if (failure === 'access') throw new Error('Storage unavailable');
        return storage;
      },
    });
    const { getLang, setLang } = await import('../lib/lang');
    const { getNodeId, setNodeId } = await import('../lib/transmit/nodeIdentity');
    const { hasVisited, markVisited } = await import('../app/_entry/visitState');

    expect(getLang()).toBe('ko');
    setLang('en');
    expect(getLang()).toBe('en');
    const initialAlias = getNodeId();
    expect(initialAlias).toMatch(/^NODE-[A-Z2-9]{5}$/);
    expect(getNodeId()).toBe(initialAlias);
    setNodeId('MY_ALIAS');
    expect(getNodeId()).toBe('MY_ALIAS');
    setNodeId('');
    expect(getNodeId()).toBe('');
    expect(hasVisited()).toBe(false);
    markVisited();
    expect(hasVisited()).toBe(true);
  });

  it('does not access browser storage or share preferences during server rendering', async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    const { getLang, setLang } = await import('../lib/lang');
    const { getNodeId, setNodeId } = await import('../lib/transmit/nodeIdentity');
    const { hasVisited, markVisited } = await import('../app/_entry/visitState');

    setLang('en');
    setNodeId('SERVER_ALIAS');
    markVisited();
    expect(getLang()).toBe('ko');
    expect(getNodeId()).toBe('');
    expect(hasVisited()).toBe(false);
  });
});
