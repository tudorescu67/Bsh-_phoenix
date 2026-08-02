#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const defaultDirs = ['commands', 'events', 'utils', 'scripts'];
const targets = process.argv.slice(2);
const scanDirs = (targets.length ? targets : defaultDirs)
  .map((dir) => path.join(root, dir))
  .filter((dir) => fs.existsSync(dir));

function collectJsFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      collectJsFiles(fullPath, out);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.js')) {
      out.push(fullPath);
    }
  }
}

const files = [];
for (const dir of scanDirs) {
  collectJsFiles(dir, files);
}

if (files.length === 0) {
  console.log('No JavaScript files found in configured folders.');
  process.exit(0);
}

let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`Syntax check failed for ${failed} file(s).`);
  process.exit(1);
}

console.log(`Syntax check passed for ${files.length} file(s).`);
