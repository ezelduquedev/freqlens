const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) process.exit(0);

const content = fs.readFileSync(filePath, 'utf8');

// Phase 1: Sequence editor (the rebase todo list)
// Detect it by presence of "pick <hash> <message>" lines
if (/^(pick|reword)\s+[0-9a-f]+\s+/m.test(content)) {
  const updated = content
    .replace(/^pick (\S+) (Redise[^\n]*)/m, 'reword $1 $2')
    .replace(/^pick (\S+) (redise[^\n]*)/m, 'reword $1 $2');
  fs.writeFileSync(filePath, updated);
  process.exit(0);
}

// Phase 2: Commit message editor — replace the actual message text
if (/Redise/i.test(content)) {
  fs.writeFileSync(filePath,
    'feat: initial FreqLens UI architecture and core DSP engine setup\n');
  process.exit(0);
}

if (/redise/i.test(content)) {
  fs.writeFileSync(filePath,
    'feat: core layout redesign -- layouts, theming tokens and dashboard scaffolding\n');
  process.exit(0);
}

// All other commits: leave untouched
