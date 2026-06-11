#!/usr/bin/env node

/**
 * Claude Code Unplugged - Skills Validator
 * Validates the formatting, metadata, and frontmatter of generated skills.
 */

const fs = require('fs');
const path = require('path');
const { discoverSkills } = require('./lib/discover-skills');
const { validateSkill } = require('./lib/validate-skill');
const { parseFrontmatter } = require('./lib/frontmatter');

function validateSkills() {
  const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '../skills');
  
  if (!fs.existsSync(skillsDir)) {
    console.error('Error: skills directory does not exist!');
    process.exit(1);
  }

  const skills = discoverSkills(skillsDir);
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
    const { valid, errors } = validateSkill(skill, content);

    if (!valid) {
      console.error(`❌ [${skill}] ${errors[0]}`);
      for (let i = 1; i < errors.length; i++) {
        console.error(`    ${errors[i]}`);
      }
      errorsCount++;
      continue;
    }

    const meta = parseFrontmatter(content);
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
