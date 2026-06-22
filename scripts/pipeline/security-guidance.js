/**
 * Pipeline: Security Guidance
 * Translates the security-guidance plugin hooks into a portable skill,
 * including pre-execution verification gates and dangerous pattern scanning.
 */

const fs = require('fs');
const path = require('path');
const { cleanAndNeutralize, renamePath } = require('../lib/platform');
const { writeSkillMd } = require('../lib/skill-md');
const { copyRecursiveSync } = require('../lib/files');

/**
 * Process the security-guidance plugin into a skill.
 *
 * @param {string} sourcePath    Path to the source repository root
 * @param {string} skillsDestDir Path to the destination skills directory
 */
function processSecurityGuidance(sourcePath, skillsDestDir) {
  const pluginsDir = path.join(sourcePath, 'plugins');
  const secPath = path.join(pluginsDir, 'security-guidance');
  if (!fs.existsSync(secPath)) {
    console.log('Skipping missing plugin: security-guidance');
    return;
  }

  const destSecDir = path.join(skillsDestDir, 'security-guidance');
  fs.mkdirSync(destSecDir, { recursive: true });

  // Copy .claude-plugin/plugin.json for internal python script version checking
  const pluginJsonSrc = path.join(secPath, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pluginJsonSrc)) {
    const destPluginJsonDir = path.join(destSecDir, '.claude-plugin');
    fs.mkdirSync(destPluginJsonDir, { recursive: true });
    copyRecursiveSync(pluginJsonSrc, path.join(destPluginJsonDir, 'plugin.json'), {
      mapDest: (destPath) => renamePath(destPath),
      transform: (content) => cleanAndNeutralize(content, { skillName: 'security-guidance' }),
    });
    console.log('Copied security-guidance .claude-plugin/plugin.json for script compatibility.');
  }

  // Copy python/bash scripts to nested scripts/ (excluding hooks.json)
  const hooksSrc = path.join(secPath, 'hooks');
  if (fs.existsSync(hooksSrc)) {
    const destScriptsDir = path.join(destSecDir, 'scripts');
    fs.mkdirSync(destScriptsDir, { recursive: true });

    const files = fs.readdirSync(hooksSrc);
    for (const file of files) {
      if (file !== 'hooks.json') {
        copyRecursiveSync(path.join(hooksSrc, file), path.join(destScriptsDir, file), {
          mapDest: (destPath) => renamePath(destPath),
          transform: (content) => cleanAndNeutralize(content, { skillName: 'security-guidance' }),
        });
      }
    }
    console.log('Copied security helper scripts to scripts/ directory.');
  }

  // Build security SKILL.md
  let secReadme = '';
  const readmeFile = path.join(secPath, 'README.md');
  if (fs.existsSync(readmeFile)) {
    secReadme = fs.readFileSync(readmeFile, 'utf8').trim();
  }

  const secBody = `# Security Guidance

${secReadme}

---

## Pre-Execution Verification (PreToolUse)

Before executing commands, creating files, or editing code, you should review your work for common security pitfalls. You can run the built-in python script helper using your bash tool to scan files for dangerous patterns:

\`\`\`bash
python3 scripts/security_reminder_hook.py
\`\`\`

### Dangerous Patterns Checked
The pattern rules scanner checks for:
- Raw \`innerHTML\` usage (XSS vulnerability)
- Unsafe yaml/pickle serialization (\`yaml.load\`, \`pickle.load\` without restrictions)
- Unsafe PyTorch model loading (\`torch.load(weights_only=False)\`)
- Hardcoded api keys, secrets, and auth credentials
- SQL injections and shell command injection patterns
- Path traversal issues and unsafe file path operations

---

## Quality Verification Checklist (Stop / PostToolUse)

Upon completing code writing or editing:
1. Conduct a background review of your diff to check for vulnerability introductions.
2. If any changes touch critical web interfaces, ensure input validation is applied.
3. Review database commands to prevent auth bypass or IDOR.
4. Address or acknowledge any security warnings found during execution.
`;

  writeSkillMd(destSecDir, 'security-guidance', 'Security warnings, patterns scanner, and LLM diff security reviews', secBody);
}

module.exports = { processSecurityGuidance };
