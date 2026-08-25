import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const appDist = join(root, 'app', 'dist');
const outDir = join(root, 'dist');
const clientDir = join(outDir, 'client');
const serverDir = join(outDir, 'server');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(clientDir, { recursive: true });
mkdirSync(serverDir, { recursive: true });
mkdirSync(join(outDir, '.openai'), { recursive: true });

cpSync(appDist, clientDir, { recursive: true });
cpSync(join(root, '.openai', 'hosting.json'), join(outDir, '.openai', 'hosting.json'));

writeFileSync(
  join(serverDir, 'index.js'),
  `const immutablePath = /^\\/(assets|audio|art|fonts|models)\\//;

function withCacheHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  if (immutablePath.test(pathname)) {
    headers.set('cache-control', 'public, max-age=31536000, immutable');
  } else {
    headers.set('cache-control', 'no-cache');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function fetchAsset(request, env, pathname) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    return new Response('Static assets binding is not available.', { status: 500 });
  }
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return env.ASSETS.fetch(new Request(url, request));
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      pathname = url.pathname;
    }

    const primaryPath = pathname === '/' ? '/index.html' : pathname;
    let response = await fetchAsset(request, env, primaryPath);

    if (response.status === 404 && !primaryPath.split('/').pop().includes('.')) {
      response = await fetchAsset(request, env, '/index.html');
      return withCacheHeaders(response, '/index.html');
    }

    return withCacheHeaders(response, primaryPath);
  },
};
`,
);

writeFileSync(
  join(serverDir, 'wrangler.json'),
  JSON.stringify(
    {
      name: 'dental-adventure',
      compatibility_date: '2026-05-15',
      compatibility_flags: ['nodejs_compat'],
      main: 'index.js',
      assets: { directory: '../client' },
      observability: { enabled: true },
      rules: [{ type: 'ESModule', globs: ['**/*.js', '**/*.mjs'] }],
      vars: {},
    },
    null,
    2,
  ),
);

console.log('Packaged Sites static output in dist/.');
