import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3005';
const includeApi = process.env.SMOKE_API === '1';
const routes = ['/', '/home', '/about', '/gate', '/gate/request', '/lineup', '/status', '/transmit', '/signal', '/link', '/entry'];

async function waitUntilReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/home`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`runtime did not become ready: ${baseUrl}`);
}

async function findWebglChunks() {
  const chunks = [];
  const chunkDir = '.next/static/chunks';
  for (const file of await readdir(chunkDir)) {
    if (!file.endsWith('.js')) continue;
    const source = await readFile(path.join(chunkDir, file), 'utf8');
    if (source.includes('WebGLRenderer') && source.includes('EffectComposer')) chunks.push(file);
  }
  return chunks;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

await waitUntilReady();
const webglChunks = await findWebglChunks();
const titles = new Set();

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  const html = await response.text();
  if (!response.ok) throw new Error(`${route}: expected 200, received ${response.status}`);
  const mainCount = (html.match(/<main(?:\s|>)/g) ?? []).length;
  if (mainCount !== 1) throw new Error(`${route}: expected one main, received ${mainCount}`);
  if (!html.includes('href="#main-content"') || !html.includes('id="main-content"')) {
    throw new Error(`${route}: skip-link contract missing`);
  }
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1];
  if (!title || !stripTags(h1 ?? '')) throw new Error(`${route}: title or visible h1 missing`);
  titles.add(title);
  if (webglChunks.some(chunk => html.includes(chunk)) || /<canvas(?:\s|>)/.test(html)) {
    throw new Error(`${route}: WebGL entered the initial HTML graph`);
  }
}

if (titles.size !== routes.length) throw new Error('route titles are not unique');

if (includeApi) {
  for (const route of ['/api/events', '/api/transmit?page=1']) {
    const response = await fetch(`${baseUrl}${route}`);
    if (!response.ok || response.headers.get('cache-control') !== 'no-store') {
      throw new Error(`${route}: public API/cache smoke failed (${response.status})`);
    }
  }
}

console.log(`HTTP smoke PASS: ${routes.length} routes at ${baseUrl}; no WebGL in the initial HTML graph`);
