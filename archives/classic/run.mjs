import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(root, '../../.design-archive/classic');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const source = path.join(root, 'source.tar.gz');
const digest = createHash('sha256').update(await readFile(source)).digest('hex');
if (digest !== manifest.sha256) throw new Error('Archived source checksum does not match its manifest.');

const [command = 'prepare', ...args] = process.argv.slice(2);
if (!['prepare', 'dev', 'build', 'start'].includes(command)) throw new Error('Use prepare, dev, build or start.');
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const run = (executable, arguments_, cwd = destination) => new Promise((resolve, reject) => {
  const child = spawn(executable, arguments_, { cwd, stdio: 'inherit', env: process.env });
  child.on('error', reject);
  child.on('exit', (code, signal) => code === 0 || signal === 'SIGINT'
    ? resolve() : reject(new Error(`${executable} exited with ${code ?? signal}`)));
});

const marker = path.join(destination, '.archive-source');
if (await exists(destination)) {
  if (!await exists(marker) || (await readFile(marker, 'utf8')).trim() !== digest) {
    throw new Error(`An unrecognized archive runtime already exists at ${destination}; it has been left untouched.`);
  }
} else {
  await mkdir(destination, { recursive: true });
  await run('tar', ['-xzf', source, '-C', destination]);
  await writeFile(marker, `${digest}\n`);
}
console.log(`Classic design: ${manifest.sourceCommit}\nRuntime: ${destination}`);

if (command !== 'prepare') {
  if (!await exists(path.join(destination, 'node_modules/next/package.json'))) {
    await run('npm', ['ci']);
  }
  if (command === 'build') await run('npm', ['run', 'build']);
  else {
    const portIndex = args.indexOf('--port');
    const port = portIndex >= 0 ? args[portIndex + 1] : '3005';
    if (!port || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid port.');
    process.env.NODE_ENV = command === 'dev' ? 'development' : 'production';
    await run(process.execPath, [path.join(destination, 'node_modules/next/dist/bin/next'), command, '-H', '127.0.0.1', '-p', port]);
  }
}
