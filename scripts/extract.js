#!/usr/bin/env node

/**
 * Claude Code Unplugged - Skills Extraction Utility
 * Orchestrates the extraction pipeline by delegating to stage modules.
 */

const path = require('path');
const fs = require('fs');
const { printUsage, parseArgs } = require('./lib/cli');
const { copyDirectSkills } = require('./pipeline/copy-direct');
const { mergeCommandsAndAgents } = require('./pipeline/merge-commands');
const { processOutputStyles } = require('./pipeline/output-styles');
const { processSecurityGuidance } = require('./pipeline/security-guidance');
const { processGitHubManagement } = require('./pipeline/github-management');

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.source || !options.target) {
    console.error('Error: Both --source and --target paths must be specified.');
    printUsage();
    process.exit(1);
  }

  const sourcePath = path.resolve(options.source);
  const targetPath = path.resolve(options.target);

  const cwd = process.cwd();
  if (!sourcePath.startsWith(cwd) && !targetPath.startsWith(cwd)) {
    console.warn('Warning: Source or target paths are outside the current working directory. Proceeding anyway.');
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source directory does not exist at "${sourcePath}"`);
    process.exit(1);
  }

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Target directory does not exist at "${targetPath}"`);
    process.exit(1);
  }

  if (!fs.statSync(sourcePath).isDirectory()) {
    console.error(`Error: Source is not a directory: "${sourcePath}"`);
    process.exit(1);
  }

  if (!fs.statSync(targetPath).isDirectory()) {
    console.error(`Error: Target is not a directory: "${targetPath}"`);
    process.exit(1);
  }

  const skillsDestDir = path.join(targetPath, 'skills');
  fs.mkdirSync(skillsDestDir, { recursive: true });

  // -------------------------------------------------------------
  // 1. Copy Direct Skills
  // -------------------------------------------------------------
  console.log('\n--- Copying Direct Skills ---');
  copyDirectSkills(sourcePath, skillsDestDir);

  // -------------------------------------------------------------
  // 2. Merged Skills (Commands + Agents)
  // -------------------------------------------------------------
  console.log('\n--- Merging Commands and Agents ---');
  mergeCommandsAndAgents(sourcePath, skillsDestDir);

  // -------------------------------------------------------------
  // 3. Translate Output Styles
  // -------------------------------------------------------------
  console.log('\n--- Processing Output Styles ---');
  processOutputStyles(sourcePath, skillsDestDir);

  // -------------------------------------------------------------
  // 4. Translate Security Guidance
  // -------------------------------------------------------------
  console.log('\n--- Translating Security Guidance ---');
  processSecurityGuidance(sourcePath, skillsDestDir);

  // -------------------------------------------------------------
  // 5. Github Management Skill
  // -------------------------------------------------------------
  console.log('\n--- Packaging GitHub Management Skill ---');
  processGitHubManagement(sourcePath, skillsDestDir);

  console.log('\nExtraction completed successfully!');
}

module.exports = { main };

if (require.main === module) {
  main();
}
