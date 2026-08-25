import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const appNodeModules = join(root, 'app', 'node_modules');

if (existsSync(appNodeModules)) {
  console.log('Using existing app/node_modules.');
  process.exit(0);
}

const result = spawnSync('npm', ['ci', '--prefix', 'app'], {
  cwd: root,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
