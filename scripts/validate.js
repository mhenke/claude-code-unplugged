#!/usr/bin/env node

/**
 * Claude Code Unplugged - Skills Validator
 * Validates the formatting, metadata, and frontmatter of generated skills.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./lib/frontmatter');
const { findNeutralityViolations } = require('./lib/platform');

function validateSkills() {
  const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '../skills');
  
  if (!fs.existsSync(skillsDir)) {
    console.error('Error: skills directory does not exist!');
    process.exit(1);
  }

  let skills = fs.readdirSync(skillsDir);
  const skipDirs = new Set(['.git', '.full-review', 'openspec', 'scripts', 'node_modules']);
  skills = skills.filter(d => !d.startsWith('.') && !skipDirs.has(d));
  console.log(`Validating ${skills.length} skills...\n`);

  let errorsCount = 0;
  let successCount = 0;

  for (const skill of skills) {
    const skillPath = path.join(skillsDir, skill);
    const stat = fs.statSync(skillPath);
    if (!stat.isDirectory()) continue;

    const skillMdPath = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
      console.error(`❌ [${skill}] Missing SKILL.md`);
      errorsCount++;
      continue;
    }

    const content = fs.readFileSync(skillMdPath, 'utf8');
    
    // Check if starts with YAML frontmatter
    if (!content.startsWith('---')) {
      console.error(`❌ [${skill}] SKILL.md does not start with YAML frontmatter delimiter (---)`);
      errorsCount++;
      continue;
    }

    const meta = parseFrontmatter(content);
    
    const allowedFields = new Set(['name', 'description']);
    const unsupportedFields = Object.keys(meta).filter(field => !allowedFields.has(field));
    if (unsupportedFields.length > 0) {
      console.error(`❌ [${skill}] Unsupported frontmatter fields: ${unsupportedFields.join(', ')}`);
      errorsCount++;
      continue;
    }

    // Check metadata fields
    if (!meta.name) {
      console.error(`❌ [${skill}] Missing "name" field in frontmatter`);
      errorsCount++;
      continue;
    }

    if (meta.name !== skill) {
      console.error(`❌ [${skill}] Frontmatter name "${meta.name}" does not match folder name "${skill}"`);
      errorsCount++;
      continue;
    }

    if (!meta.description) {
      console.error(`❌ [${skill}] Missing "description" field in frontmatter`);
      errorsCount++;
      continue;
    }

    // Check if name is a valid slug (alphanumeric, dashes, lowercase)
    if (!/^[a-z0-9-]+$/.test(meta.name)) {
      console.error(`❌ [${skill}] Name "${meta.name}" is not a valid slug (must contain only lowercase letters, numbers, and dashes)`);
      errorsCount++;
      continue;
    }

    // Check if body content exists (beyond frontmatter)
    const body = content.replace(/^---[\s\S]*?---\r?\n/, '').trim();
    if (body.length === 0) {
      console.error(`❌ [${skill}] SKILL.md contains empty instruction body`);
      errorsCount++;
      continue;
    }

    // Platform-neutrality checks
    const neutralityIssues = findNeutralityViolations(content);

    if (neutralityIssues.length > 0) {
      console.error(`❌ [${skill}] Platform-neutrality violations:`);
      neutralityIssues.forEach(issue => console.error(`    - ${issue}`));
      errorsCount++;
      continue;
    }

    console.log(`✅ [${skill}] Valid (${meta.description.slice(0, 50)}...)`);
    successCount++;
  }

  console.log(`\nValidation complete: ${successCount} successful, ${errorsCount} failed.`);
  if (errorsCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

validateSkills();
