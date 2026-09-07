'use client';
import React from 'react';

const ENABLE_VIGNETTE = true; // 비네팅 효과 전역 활성화

export default function CRTWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden bg-terminal-bg-base">

      {/* Screen curvature shadow (Vignette) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-50 mix-blend-multiply"
        style={{
          background: ENABLE_VIGNETTE
            ? 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.3) 100%)'
            : 'transparent',
        }}
      />

      {/* 전역 스캔라인 (Global Scanlines over Text) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40 mix-blend-multiply opacity-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      {/* 한 번의 짧은 스캔을 실제 브랜드 영역 안에서만 재생한다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 z-40 h-full bg-gradient-to-b from-transparent via-terminal-accent-primary/5 to-transparent animate-scanline-beam"
      />

      {/* Chromatic aberration 엣지 빛번짐 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 opacity-70"
        style={{
          boxShadow: ENABLE_VIGNETTE
            ? 'inset 0 0 60px rgba(0,0,0,0.25), inset 2px 0 rgb(var(--color-accent-alert)/0.05), inset -2px 0 rgb(var(--color-accent-secondary)/0.05)'
            : 'inset 2px 0 rgb(var(--color-accent-alert)/0.05), inset -2px 0 rgb(var(--color-accent-secondary)/0.05)',
        }}
      />

      {/* Phosphor glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-[0.03]"
        style={{ background: 'radial-gradient(ellipse at center, rgb(var(--color-accent-primary)) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
