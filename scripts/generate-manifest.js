#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '..');
const skipDirs = new Set(['.git', '.full-review', 'openspec', 'scripts', 'node_modules']);
const skills = fs.readdirSync(skillsDir).filter(d => {
  if (d.startsWith('.')) return false;
  if (skipDirs.has(d)) return false;
  const stat = fs.statSync(path.join(skillsDir, d));
  if (!stat.isDirectory()) return false;
  return fs.existsSync(path.join(skillsDir, d, 'SKILL.md'));
});

const manifest = [];

for (const name of skills) {
  const mdPath = path.join(skillsDir, name, 'SKILL.md');
  const content = fs.readFileSync(mdPath, 'utf8');
  
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;
  
  const meta = {};
  fmMatch[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      meta[key] = val;
    }
  });

  const entry = {
    name,
    description: meta.description || '',
    path: name,
  };

  if (meta.version) entry.version = meta.version;

  const body = content.replace(/^---[\s\S]*?---\r?\n/, '').trim();
  entry.bodyLength = body.length;

  manifest.push(entry);
}

const output = {
  name: 'claude-code-unplugged',
  description: 'Portable agent skills, workflows, and automation patterns extracted from Claude Code. Platform-neutral SKILL.md format.',
  skills: manifest,
};

fs.writeFileSync(
  path.resolve(__dirname, '../skills.json'),
  JSON.stringify(output, null, 2) + '\n'
);

console.log(`Generated skills.json with ${manifest.length} skills.`);
