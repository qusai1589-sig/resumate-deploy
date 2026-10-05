import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

for (const filename of readdirSync(new URL('.', import.meta.url)).filter(file => file.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', new URL(filename, import.meta.url).pathname], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('JavaScript backend syntax checks passed. No compilation or external packages required.');
