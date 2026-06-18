#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { discoverSkills } = require('./lib/discover-skills');
const { parseFrontmatter, stripFrontmatter } = require('./lib/frontmatter');

const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '../skills');
const manifestPath = path.resolve(__dirname, '../skills.json');
const lockPath = path.resolve(__dirname, '../skills-lock.json');
const defaultSkillVersion = process.env.SKILL_VERSION || '0.1.0';

// Parse --output / -o flag
const args = process.argv.slice(2);
let outputPath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' || args[i] === '-o') {
    outputPath = args[++i];
  }
}
const finalManifestPath = outputPath || manifestPath;
const skills = discoverSkills(skillsDir);

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

// Read provenance from skills-lock.json
const provenance = {};
if (fs.existsSync(lockPath)) {
  try {
    const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (lockData.generated) {
      if (lockData.generated.sourceCommit) {
        provenance.sourceCommit = lockData.generated.sourceCommit;
      }
      if (lockData.generated.sourceRepository) {
        provenance.sourceRepository = lockData.generated.sourceRepository;
      }
    }
  } catch (e) {
    console.warn('Warning: Could not parse skills-lock.json for provenance:', e.message);
  }
}

// Environment variables override lockfile values (useful for CI)
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

const provInfo = Object.keys(provenance).length > 0 ? ` (provenance: ${JSON.stringify(provenance)})` : ' (no provenance)';
console.log(`Generated skills.json with ${manifest.length} skills${provInfo}.`);
