import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const viteCli = resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

test('build:single emits fully compiled inline CSS', (t) => {
  const outDir = mkdtempSync(join(tmpdir(), 'excel-merge-tool-single-build-'));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  const build = spawnSync(
    process.execPath,
    [viteCli, 'build', '--config', 'vite.single.config.js', '--outDir', outDir],
    {
      cwd: projectRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(
    build.status,
    0,
    `single-file build failed\nstdout:\n${build.stdout}\nstderr:\n${build.stderr}`,
  );

  const builtHtmlPath = join(outDir, 'index.html');
  assert.ok(existsSync(builtHtmlPath), 'single-file build should emit index.html');

  const html = readFileSync(builtHtmlPath, 'utf8');
  assert.match(html, /<style[^>]*>/, 'single-file build should inline CSS into index.html');
  assert.doesNotMatch(html, /@apply\b/, 'single-file build should not contain raw @apply');
  assert.doesNotMatch(html, /@tailwind\b/, 'single-file build should not contain raw @tailwind');
  assert.doesNotMatch(
    html,
    /@import\s+["']tailwindcss["']/,
    'single-file build should not contain raw Tailwind imports',
  );
  assert.match(
    html,
    /input\[type=text\].*border-color:var\(--color-outline-variant\)/s,
    'single-file build should contain compiled base input styles',
  );
  assert.match(
    html,
    /\.bg-surface-container-lowest\{/,
    'single-file build should contain compiled Tailwind utilities',
  );
  assert.doesNotMatch(
    html,
    /<link[^>]+rel=["']stylesheet["']/,
    'single-file build should not emit external stylesheet links',
  );
});
