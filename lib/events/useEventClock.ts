'use client';

import { useEffect, useState } from 'react';
import { getEventBoundaryTimes } from './lifecycle';
import type { TerminalEvent } from './types';

const MAX_TIMEOUT = 2_147_483_647;

export function useEventClock(events: readonly TerminalEvent[], accessWindowDays?: number): Date {
  const [now, setNow] = useState(() => new Date());
  // Depend on actual boundaries so a caller's fresh empty array cannot restart the clock.
  const boundaryKey = getEventBoundaryTimes(events, accessWindowDays).join(',');

  useEffect(() => {
    const boundaries = boundaryKey ? boundaryKey.split(',').map(Number) : [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    function refresh() {
      clearTimeout(timer);
      const current = new Date();
      setNow(current);
      const next = boundaries.find((boundary) => boundary > current.getTime());
      if (next !== undefined) {
        timer = setTimeout(refresh, Math.min(next - current.getTime(), MAX_TIMEOUT));
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    timer = setTimeout(refresh, 0);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [boundaryKey]);

  return now;
}
