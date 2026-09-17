import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({ initOpenNextCloudflareForDev: vi.fn() }));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('browser script policy', () => {
  it.each(['development', 'production'] as const)('permits the required scripts in %s', async (environment) => {
    vi.stubEnv('NODE_ENV', environment);
    const { default: config } = await import('../next.config');
    expect(config.allowedDevOrigins).toEqual(['127.0.0.1']);
    const routes = await config.headers!();
    const policy = routes.find(route => route.source === '/:path*')!.headers
      .find(header => header.key === 'Content-Security-Policy')!.value;
    const scripts = policy.split('; ').find(directive => directive.startsWith('script-src '))!;
    expect(scripts.includes("'unsafe-eval'")).toBe(environment === 'development');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });
});
