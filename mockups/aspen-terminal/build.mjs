import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const destination = path.join(root, 'dist');
const result = await build({
  entryPoints: [path.join(root, 'main.tsx')], bundle: true, minify: true, write: false,
  outfile: path.join(destination, 'app.js'), format: 'iife', platform: 'browser',
  target: ['es2020'], jsx: 'automatic', loader: { '.ttf': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'inline',
});
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text.replaceAll('</script', '<\\/script');
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text;
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><meta name="robots" content="noindex,nofollow"><title>TERMINAL — Aspen grid mockup</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
await mkdir(destination, { recursive: true });
await writeFile(path.join(destination, 'index.html'), html);
console.log(`Built ${path.join(destination, 'index.html')} (${Buffer.byteLength(html)} bytes)`);

if (process.argv.includes('--serve')) {
  const server = createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
    if (!['/', '/index.html'].includes(new URL(request.url, 'http://localhost').pathname)) { response.writeHead(404); response.end(); return; }
    try {
      const body = await readFile(path.join(destination, 'index.html'));
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(500); response.end('Rebuild the mockup.'); }
  });
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(3005, '127.0.0.1', () => console.log('Mockup: http://127.0.0.1:3005 — Ctrl+C to stop'));
}
