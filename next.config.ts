import type { NextConfig } from "next";

// Cloudflare Workers D1 바인딩 에뮬레이션은 `npm run cf:preview` (opennextjs-cloudflare preview) 환경에서만 동작함
// Docker dev 환경(`npm run dev`)에서는 D1 바인딩 없이 실행됨 — API 라우트는 D1 DB 생성 후 cf:preview 또는 배포 환경에서 동작

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
