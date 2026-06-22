#!/usr/bin/env node

/**
 * Claude Code Unplugged - Skills Extraction Utility
 * Orchestrates the extraction pipeline by delegating to stage modules.
 */

const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const { printUsage, parseArgs } = require('./lib/cli');
const { copyDirectSkills } = require('./pipeline/copy-direct');
const { mergeCommandsAndAgents } = require('./pipeline/merge-commands');
const { processOutputStyles } = require('./pipeline/output-styles');
const { processSecurityGuidance } = require('./pipeline/security-guidance');
const { processGitHubManagement } = require('./pipeline/github-management');
const { generateLockFile } = require('./lib/lockfile');
const { runPipeline } = require('./lib/pipeline-registry');

function resolveCommit(commit, sourcePath) {
  if (!commit) return '';
  if (commit === 'auto') {
    try {
      return cp.execSync('git rev-parse HEAD', { cwd: sourcePath, encoding: 'utf8' }).trim();
    } catch {
      console.warn('Warning: Could not auto-detect commit from source directory. Proceeding without commit.');
      return '';
    }
  }
  return commit;
}

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

  const commit = resolveCommit(options.commit, sourcePath);
  if (commit) {
    console.log(`Source commit: ${commit}`);
  }

  const skillsDestDir = path.join(targetPath, 'skills');
  fs.mkdirSync(skillsDestDir, { recursive: true });

  const stages = [
    { name: 'Copying Direct Skills', fn: copyDirectSkills },
    { name: 'Merging Commands and Agents', fn: mergeCommandsAndAgents },
    { name: 'Processing Output Styles', fn: processOutputStyles },
    { name: 'Translating Security Guidance', fn: processSecurityGuidance },
    { name: 'Packaging GitHub Management Skill', fn: processGitHubManagement },
  ];

  const { errors } = runPipeline(stages, sourcePath, skillsDestDir);

  if (errors.length > 0) {
    console.error(`\n${errors.length} stage(s) failed. Aborting lockfile generation.`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Generate skills-lock.json
  // -------------------------------------------------------------
  console.log('\n--- Generating skills-lock.json ---');
  const lockData = generateLockFile(skillsDestDir, {
    stalenessThresholdDays: 30,
    commit: commit || undefined,
    repository: 'anthropics/claude-code',
  });
  const lockPath = path.join(targetPath, 'skills-lock.json');
  fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2) + '\n', 'utf8');
  console.log(`Wrote lock file to ${lockPath}`);

  console.log('\nExtraction completed successfully!');
}

module.exports = { main };

if (require.main === module) {
  main();
}
