'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode, Suspense, useEffect } from 'react';

function Inner({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-scroll-region]').forEach(region => region.scrollTo({ top: 0, behavior: 'instant' }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return <div className="relative w-full">{children}</div>;
}

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-terminal-bg-base" />}>
      <Inner>{children}</Inner>
    </Suspense>
  );
}
