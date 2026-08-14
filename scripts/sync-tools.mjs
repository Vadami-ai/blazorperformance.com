// Copies the built capacity calculator from its sibling repo into public/tools/.
// Run after `npm run build` in ../blazor-server-capacity-calculator.
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const calcDist = resolve(root, '..', 'blazor-server-capacity-calculator', 'dist');
const toolDir = resolve(root, 'public', 'tools', 'capacity-calculator');

if (!existsSync(calcDist)) {
  console.error(`Not found: ${calcDist}\nBuild the calculator first: cd ../blazor-server-capacity-calculator && npm run build`);
  process.exit(1);
}

mkdirSync(toolDir, { recursive: true });
for (const f of ['index.html', 'main.js', 'main.css']) {
  copyFileSync(resolve(calcDist, f), resolve(toolDir, f));
}
console.log('Synced capacity calculator into public/tools/capacity-calculator/');
