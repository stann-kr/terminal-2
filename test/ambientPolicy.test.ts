import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { shouldRenderHomeAmbient } from '../app/home/ambientPolicy';

describe('optional terminal ambient rendering policy', () => {
  const ready = {
    allowMotion: true,
    heroVisible: true,
    webglAvailable: true,
  };

  it('allows WebGL only for the visible experience with non-essential motion enabled', () => {
    expect(shouldRenderHomeAmbient(ready)).toBe(true);
  });

  it('keeps WebGL in the optional entry instead of regular event discovery', async () => {
    const [rootLayout, homeLayout, homeEntry, experience] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('app/home/layout.tsx', 'utf8'),
      readFile('app/page.tsx', 'utf8'),
      readFile('app/_entry/EntryExperience.tsx', 'utf8'),
    ]);

    expect(rootLayout).not.toContain('HomeAmbient');
    expect(homeLayout).not.toContain('HomeAmbient');
    expect(homeEntry).not.toContain('HomeAmbient');
    expect(experience).toContain('<HomeAmbient anchorId="main-content" />');
  });

  it('stops for reduced motion, save-data or hidden-document policy, viewport exit, and WebGL failure', () => {
    expect(shouldRenderHomeAmbient({ ...ready, allowMotion: false })).toBe(false);
    expect(shouldRenderHomeAmbient({ ...ready, heroVisible: false })).toBe(false);
    expect(shouldRenderHomeAmbient({ ...ready, webglAvailable: false })).toBe(false);
  });
});
