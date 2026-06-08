/**
 * Frontmatter parsing and normalization utilities.
 * Shared across extract, validate, and manifest generation.
 */

/**
 * Parse YAML frontmatter from markdown content.
 * Returns an object of key-value pairs. Values have surrounding quotes stripped.
 * Returns empty object if no frontmatter delimiters are found.
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
 * Strip frontmatter from markdown content, returning the body text.
 * If no frontmatter is found, returns the original content unchanged.
 */
function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\r?\n/, '');
}

/**
 * Normalize skill frontmatter to only contain name and description fields.
 * If skillName is provided, it overrides the parsed name.
 */
function normalizeSkillFrontmatter(content, skillName) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return content;

  const meta = parseFrontmatter(content);
  const name = skillName || meta.name || '';
  const description = meta.description || '';

  return content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\nname: ${name}\ndescription: ${description}\n---`);
}

module.exports = {
  parseFrontmatter,
  stripFrontmatter,
  normalizeSkillFrontmatter,
};
