/**
 * Pipeline: Copy Direct Skills
 * Extracts skills that are already in a skills/ subdirectory within a plugin
 * and normalizes their SKILL.md frontmatter to match the skill folder slug.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter, normalizeSkillFrontmatter } = require('../lib/frontmatter');
const { cleanAndNeutralize } = require('../lib/platform');
const { copyRecursiveSync } = require('../lib/files');

/**
 * Copy a direct skill directory while normalizing its SKILL.md frontmatter.
 *
 * For directories: recursively copies via copyRecursiveSync with transform.
 * For SKILL.md: parses frontmatter, normalizes name to skillName, cleans content.
 * For other files: uses copyRecursiveSync with the transform callback.
 *
 * @param {string} srcDir    Source skill directory
 * @param {string} destDir   Destination skill directory
 * @param {string} skillName Desired skill name (slug) to enforce in frontmatter
 */
function copySkillNormalized(srcDir, destDir, skillName) {
  fs.mkdirSync(destDir, { recursive: true });
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    const srcItem = path.join(srcDir, item);
    const destItem = path.join(destDir, item);
    const stats = fs.statSync(srcItem);
    if (stats.isDirectory()) {
      copyRecursiveSync(srcItem, destItem, { transform: (content) => cleanAndNeutralize(content) });
    } else if (item === 'SKILL.md') {
      let content = fs.readFileSync(srcItem, 'utf8');
      const meta = parseFrontmatter(content);
      if (meta.name !== skillName) {
        console.log(`  Normalizing name: "${meta.name}" -> "${skillName}"`);
      }
      content = normalizeSkillFrontmatter(content, skillName);
      content = cleanAndNeutralize(content);
      fs.writeFileSync(destItem, content, 'utf8');
    } else {
      copyRecursiveSync(srcItem, destItem, { transform: (content) => cleanAndNeutralize(content) });
    }
  }
}

/**
 * Copy direct skills from sourcePath/plugins (per-plugin skills/ dirs) into skillsDestDir.
 *
 * @param {string} sourcePath    Path to the source repository root
 * @param {string} skillsDestDir Path to the destination skills directory
 */
function copyDirectSkills(sourcePath, skillsDestDir) {
  const pluginsDir = path.join(sourcePath, 'plugins');
  if (!fs.existsSync(pluginsDir)) return;

  const plugins = fs.readdirSync(pluginsDir);
  for (const plugin of plugins) {
    const skillPath = path.join(pluginsDir, plugin, 'skills');
    if (fs.existsSync(skillPath) && fs.statSync(skillPath).isDirectory()) {
      const skills = fs.readdirSync(skillPath);
      for (const skill of skills) {
        const srcSkill = path.join(skillPath, skill);
        const destSkill = path.join(skillsDestDir, skill);
        console.log(`Copying direct skill: ${skill} (from plugin: ${plugin})`);
        copySkillNormalized(srcSkill, destSkill, skill);
      }
    }
  }
}

module.exports = { copyDirectSkills };
