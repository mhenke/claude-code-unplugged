#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parseFrontmatter, stripFrontmatter } = require('./lib/frontmatter');

const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '../skills');
const manifestPath = path.resolve(__dirname, '../skills.json');
const defaultSkillVersion = process.env.SKILL_VERSION || '0.1.0';
const skipDirs = new Set(['.git', '.full-review', 'openspec', 'scripts', 'node_modules']);

// Parse --output / -o flag
const args = process.argv.slice(2);
let outputPath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' || args[i] === '-o') {
    outputPath = args[++i];
  }
}
const finalManifestPath = outputPath || manifestPath;
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
  
  const meta = parseFrontmatter(content);
  if (Object.keys(meta).length === 0) continue;

  const entry = {
    name,
    description: meta.description || '',
    path: `skills/${name}`,
    version: defaultSkillVersion,
  };

  const body = stripFrontmatter(content).trim();
  entry.bodyLength = body.length;

  manifest.push(entry);
}

manifest.sort((a, b) => a.name.localeCompare(b.name));

let existing = {};
if (fs.existsSync(finalManifestPath)) {
  try {
    existing = JSON.parse(fs.readFileSync(finalManifestPath, 'utf8'));
  } catch {}
}

const provenance = {
  ...(existing.provenance || {}),
};
if (process.env.SOURCE_REPOSITORY) provenance.sourceRepository = process.env.SOURCE_REPOSITORY;
if (process.env.SOURCE_COMMIT) provenance.sourceCommit = process.env.SOURCE_COMMIT;

const output = {
  name: 'claude-code-unplugged',
  description: 'Portable agent skills, workflows, and automation patterns extracted from Claude Code. Platform-neutral SKILL.md format.',
  skills: manifest,
};

if (Object.keys(provenance).length > 0) output.provenance = provenance;

fs.writeFileSync(
  finalManifestPath,
  JSON.stringify(output, null, 2) + '\n'
);

console.log(`Generated skills.json with ${manifest.length} skills.`);
