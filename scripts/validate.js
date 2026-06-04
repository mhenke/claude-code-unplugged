#!/usr/bin/env node

/**
 * Claude Code Unplugged - Skills Validator
 * Validates the formatting, metadata, and frontmatter of generated skills.
 */

const fs = require('fs');
const path = require('path');

function parseFrontmatter(content) {
  const match = content.match(/^---([\s\S]*?)---/);
  const metadata = {};
  if (match) {
    const lines = match[1].split('\n');
    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        // Remove quotes if present
        metadata[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  }
  return metadata;
}

function validateSkills() {
  const skillsDir = path.resolve(__dirname, '../skills');
  
  if (!fs.existsSync(skillsDir)) {
    console.error('Error: skills directory does not exist!');
    process.exit(1);
  }

  const skills = fs.readdirSync(skillsDir);
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
    const neutralityIssues = [];

    if (/\bClaude Code\b/i.test(content)) {
      neutralityIssues.push('contains "Claude Code" reference');
    }
    if (/hooks\.json/.test(content)) {
      neutralityIssues.push('references "hooks.json" (platform-specific hook config)');
    }
    if (/\$\{CLAUDE_PLUGIN_ROOT\}/.test(content)) {
      neutralityIssues.push('references "${CLAUDE_PLUGIN_ROOT}" (platform-specific env var)');
    }
    if (/\.claude\//i.test(content)) {
      neutralityIssues.push('references ".claude/" path (platform-specific directory)');
    }
    if (/`\/(commit|feature-dev|code-review|review-pr|hookify|mcp|clean_gone|commit-push-pr|ralph-loop|cancel-ralph|new-sdk-app|create-plugin|help)/.test(content)) {
      neutralityIssues.push('contains slash commands (platform-specific CLI syntax)');
    }

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
