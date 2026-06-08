/**
 * Pipeline: GitHub Management Skill
 * Packages repository scripts (GitHub issue/PR lifecycle automation)
 * into a portable skill.
 */

const fs = require('fs');
const path = require('path');
const { cleanAndNeutralize } = require('../lib/platform');
const { writeSkillMd } = require('../lib/skill-md');
const { copyRecursiveSync } = require('../lib/files');

/**
 * Process GitHub management scripts into a skill.
 *
 * @param {string} sourceScriptsDir Path to the source scripts directory (e.g. source repo scripts/)
 * @param {string} skillsDestDir    Path to the destination skills directory
 */
function processGitHubManagement(sourceScriptsDir, skillsDestDir) {
  if (!fs.existsSync(sourceScriptsDir) || !fs.statSync(sourceScriptsDir).isDirectory()) {
    console.log('Skipping missing scripts directory for github-management.');
    return;
  }

  const destMgmtDir = path.join(skillsDestDir, 'github-management');
  const destMgmtScripts = path.join(destMgmtDir, 'scripts');
  fs.mkdirSync(destMgmtScripts, { recursive: true });

  const scriptFiles = fs.readdirSync(sourceScriptsDir);
  let listContent = '';
  for (const file of scriptFiles) {
    copyRecursiveSync(path.join(sourceScriptsDir, file), path.join(destMgmtScripts, file), {
      transform: (content) => cleanAndNeutralize(content),
    });
    listContent += `- \`${file}\`: Copied from repository scripts.\n`;
  }
  console.log(`Copied ${scriptFiles.length} GitHub script utilities.`);

  const mgmtBody = `# GitHub Management

This skill contains scripts for automating GitHub issue lifecycles, comments, labels, duplicate detection, and general repository sweep tasks.

## Available Scripts

The following scripts are located in the \`scripts/\` directory:
${listContent}

## Execution Guidelines
To run these scripts, use your bash command tool from the workspace root:
- For TypeScript files: \`npx tsx scripts/<script-name>.ts\`
- For Shell files: \`bash scripts/<script-name>.sh\`
`;

  writeSkillMd(destMgmtDir, 'github-management', 'Issue and pull request lifecycle automation scripts', mgmtBody);
}

module.exports = { processGitHubManagement };
