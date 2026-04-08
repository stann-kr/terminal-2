'use client';
import dynamic from 'next/dynamic';

const ParticleField = dynamic(() => import('./ParticleField'), {
  ssr: false,
  loading: () => null,
});

export default function ParticleFieldDynamic() {
  return <ParticleField />;
}
