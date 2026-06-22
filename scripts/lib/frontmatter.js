/**
 * Frontmatter parsing and normalization utilities.
 * Shared across extract, validate, and manifest generation.
 */

/**
 * Parse YAML frontmatter from markdown content.
 * Returns an object of key-value pairs. Values have surrounding quotes stripped.
 * Returns empty object if no frontmatter delimiters are found.
 * @private
 */
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

/**
 * Parse frontmatter from a SKILL.md file.
 * @param {string} content - Raw markdown content
 * @returns {{ name: string, description: string, platformExempt: boolean, meta: Record<string, string>, body: string }}
 *   meta = all raw frontmatter keys (for validation of unsupported fields)
 *   platformExempt is coerced to boolean (defaults false)
 *   body = content after the frontmatter block
 */
function parseSkillFrontmatter(content) {
  const meta = parseFrontmatter(content);
  const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
  return {
    name: meta.name || '',
    description: meta.description || '',
    platformExempt: meta.platformExempt === 'true',
    meta,
    body,
  };
}

/**
 * Rewrite frontmatter to canonical name+description form.
 * @param {string} content - Raw markdown content
 * @param {string} [skillName] - Override name (optional)
 * @returns {string} Content with rewritten frontmatter block
 */
function normalizeSkillFrontmatter(content, skillName) {
  const match = content.match(/^---([\s\S]*?)---/);
  if (!match) return content;

  const meta = parseFrontmatter(content);
  const name = skillName || meta.name || '';
  const description = meta.description || '';

  return content.replace(/^---[\s\S]*?---/, `---\nname: ${name}\ndescription: ${description}\n---`);
}

module.exports = {
  parseSkillFrontmatter,
  normalizeSkillFrontmatter,
};
