/**
 * Discover skill directories under a given skills directory.
 * Skips hidden dirs, well-known non-skill dirs, and non-directories.
 * Only includes directories that contain a SKILL.md file.
 */

const fs = require('fs');
const path = require('path');

const skipDirs = new Set(['.git', '.full-review', 'openspec', 'scripts', 'node_modules']);

/**
 * Discover skill directories under skillsDir.
 * Skips hidden dirs, skipDirs, and non-directories.
 * Only includes directories that contain a SKILL.md file.
 *
 * @param {string} skillsDir - Path to the skills directory
 * @returns {string[]} Array of skill directory names (not paths)
 */
function discoverSkills(skillsDir) {
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  let entries;
  try {
    entries = fs.readdirSync(skillsDir);
  } catch {
    return [];
  }

  const skills = [];

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    if (skipDirs.has(entry)) continue;

    const entryPath = path.join(skillsDir, entry);
    let stat;
    try {
      stat = fs.statSync(entryPath);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    const skillMdPath = path.join(entryPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;

    skills.push(entry);
  }

  return skills;
}

module.exports = { discoverSkills };
