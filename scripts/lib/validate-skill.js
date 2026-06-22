/**
 * Validate a skill's name and SKILL.md content.
 * Pure function — no filesystem access.
 *
 * Performs all checks in order: frontmatter delimiter, unsupported fields,
 * missing name, name mismatch, missing description, invalid slug,
 * empty body, and platform-neutrality violations.
 */

const { parseSkillFrontmatter } = require('./frontmatter');
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
  const parsed = parseSkillFrontmatter(content);

  // 2. Check no unsupported frontmatter fields
  const allowedFields = new Set(['name', 'description', 'platformExempt']);
  const unsupportedFields = Object.keys(parsed.meta).filter(field => !allowedFields.has(field));
  if (unsupportedFields.length > 0) {
    errors.push(`Unsupported frontmatter fields: ${unsupportedFields.join(', ')}`);
  }

  // 3. Check name field exists
  if (!parsed.name) {
    errors.push('Missing "name" field in frontmatter');
  }

  // 4. Check name matches the directory name
  if (parsed.name && parsed.name !== name) {
    errors.push(`Frontmatter name "${parsed.name}" does not match folder name "${name}"`);
  }

  // 5. Check description field exists
  if (!parsed.description) {
    errors.push('Missing "description" field in frontmatter');
  }

  // 6. Check name is a valid slug (only check if name is present)
  if (parsed.name && !/^[a-z0-9-]+$/.test(parsed.name)) {
    errors.push(`Name "${parsed.name}" is not a valid slug (must contain only lowercase letters, numbers, and dashes)`);
  }

  // 7. Check body content is non-empty after stripping frontmatter with .trim()
  const body = parsed.body.trim();
  if (body.length === 0) {
    errors.push('SKILL.md contains empty instruction body');
  }

  // 8. Platform-neutrality checks (skip if skill declares itself exempt)
  const platformExempt = parsed.platformExempt;
  const neutralityIssues = findNeutralityViolations(content, { skillName: name, platformExempt });
  neutralityIssues.forEach(issue => {
    errors.push(`Platform-neutrality violation: ${issue}`);
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateSkill };
