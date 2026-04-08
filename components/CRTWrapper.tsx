'use client';
import { motion } from 'framer-motion';

export default function CRTWrapper({ children }: { children: React.ReactNode }) {
  const ENABLE_VIGNETTE = false; // 비네팅 효과 활성화 여부

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden"
      style={{ background: '#0c0904' }}
    >
      {/* Screen curvature shadow */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: ENABLE_VIGNETTE
            ? 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.85) 100%)'
            : 'transparent',
          borderRadius: '0',
        }}
      />

      {/* Scanlines overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
        }}
      />

      {/* Moving scanline beam */}
      <motion.div
        className="pointer-events-none fixed left-0 right-0 z-40"
        style={{
          height: '120px',
          background: 'linear-gradient(to bottom, transparent, rgba(212,146,10,0.05), transparent)',
        }}
        animate={{
          top: ['-10%', '110%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Chromatic aberration */}
      <div
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          boxShadow: ENABLE_VIGNETTE
            ? 'inset 0 0 100px rgba(0,0,0,0.7), inset 1px 0 rgba(200,80,32,0.04), inset -1px 0 rgba(58,152,128,0.04)'
            : 'inset 1px 0 rgba(200,80,32,0.04), inset -1px 0 rgba(58,152,128,0.04)',
        }}
      />

      {/* Phosphor glow */}
      <div
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212,146,10,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
