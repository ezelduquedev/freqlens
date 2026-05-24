const fs = require('fs');
const path = require('path');

// This script is called by Git as GIT_SEQUENCE_EDITOR or GIT_EDITOR
const filePath = process.argv[2];
if (!filePath) process.exit(0);

const content = fs.readFileSync(filePath, 'utf8');

// Phase 1: Sequence editor — mark both old commits as "reword"
if (content.includes('Redise') || content.includes('redise')) {
  const updated = content
    .replace(/^pick (d12437f[^\n]*)$/m, 'reword $1')
    .replace(/^pick (4adf59b[^\n]*)$/m, 'reword $1');
  fs.writeFileSync(filePath, updated);
  process.exit(0);
}

// Phase 2: Commit message editor — replace the message
if (content.includes('Rediseño interfaz - sistema Stitch')) {
  fs.writeFileSync(filePath,
    'feat: initial FreqLens UI architecture and core DSP engine setup\n');
  process.exit(0);
}

if (content.includes('rediseño de interfaz')) {
  fs.writeFileSync(filePath,
    'feat: UI improvements — spectrum analyzer, EQ calibration and room profiling\n');
  process.exit(0);
}
