#!/usr/bin/env node
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

const candidatePaths = [
  path.resolve(__dirname, '..', 'node_modules'),
  path.resolve(__dirname, '..', '..', 'node_modules'),
];

let jestBin;
for (const candidate of candidatePaths) {
  try {
    jestBin = require.resolve('jest/bin/jest.js', { paths: [candidate] });
    break;
  } catch (error) {
    if (!(error instanceof Error) || ('code' in error && error.code !== 'MODULE_NOT_FOUND')) {
      throw error;
    }

    const pnpmStore = path.join(candidate, '.pnpm');
    if (!fs.existsSync(pnpmStore)) {
      continue;
    }

    const entry = fs.readdirSync(pnpmStore).find((name) => name.startsWith('jest@'));

    if (!entry) {
      continue;
    }

    const candidateBin = path.join(pnpmStore, entry, 'node_modules', 'jest', 'bin', 'jest.js');
    if (fs.existsSync(candidateBin)) {
      jestBin = candidateBin;
      break;
    }
  }
}

if (!jestBin) {
  console.error('Unable to locate Jest binary in workspace node_modules.');
  process.exit(1);
}

const child = spawn(process.execPath, [jestBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
