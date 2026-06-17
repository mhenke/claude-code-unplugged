/**
 * Validate a skill's name and SKILL.md content.
 * Pure function — no filesystem access.
 *
 * Performs all checks in order: frontmatter delimiter, unsupported fields,
 * missing name, name mismatch, missing description, invalid slug,
 * empty body, and platform-neutrality violations.
 */

const { parseFrontmatter } = require('./frontmatter');
const { findNeutralityViolations } = require('./platform');

/**
 * @param {string} name - The skill directory name (slug)
 * @param {string} content - The full SKILL.md file content
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSkill(name, content) {
  const errors = [];

  // 1. Check content starts with YAML frontmatter delimiter
  if (!content.startsWith('---')) {
    errors.push('SKILL.md does not start with YAML frontmatter delimiter (---)');
  }

  // Parse frontmatter for field checks (returns {} safely for non-frontmatter content)
  const meta = parseFrontmatter(content);

  // 2. Check no unsupported frontmatter fields
  const allowedFields = new Set(['name', 'description']);
  const unsupportedFields = Object.keys(meta).filter(field => !allowedFields.has(field));
  if (unsupportedFields.length > 0) {
    errors.push(`Unsupported frontmatter fields: ${unsupportedFields.join(', ')}`);
  }

  // 3. Check name field exists
  if (!meta.name) {
    errors.push('Missing "name" field in frontmatter');
  }

  // 4. Check name matches the directory name
  if (meta.name && meta.name !== name) {
    errors.push(`Frontmatter name "${meta.name}" does not match folder name "${name}"`);
  }

  // 5. Check description field exists
  if (!meta.description) {
    errors.push('Missing "description" field in frontmatter');
  }

  // 6. Check name is a valid slug (only check if name is present)
  if (meta.name && !/^[a-z0-9-]+$/.test(meta.name)) {
    errors.push(`Name "${meta.name}" is not a valid slug (must contain only lowercase letters, numbers, and dashes)`);
  }

  // 7. Check body content is non-empty after stripping frontmatter with .trim()
  const body = content.replace(/^---[\s\S]*?---\r?\n/, '').trim();
  if (body.length === 0) {
    errors.push('SKILL.md contains empty instruction body');
  }

  // 8. Platform-neutrality checks
  const neutralityIssues = findNeutralityViolations(content, { skillName: name });
  neutralityIssues.forEach(issue => {
    errors.push(`Platform-neutrality violation: ${issue}`);
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateSkill };
