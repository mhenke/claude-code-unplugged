const path = require('path');

/**
 * Platform-specific pattern detection and neutralization.
 * Single source of truth for all platform-neutrality operations.
 */

/**
 * Apply platform-neutrality path renames.
 * Currently renames hooks.json → hook-config.json.
 * @param {string} destPath - The destination file path
 * @returns {string} The renamed path if applicable, or the original path
 */
function renamePath(destPath) {
  if (path.basename(destPath) === 'hooks.json') {
    return path.join(path.dirname(destPath), 'hook-config.json');
  }
  return destPath;
}

/**
 * Platform-specific patterns and their neutral replacements.
 * Each entry:
 *   search      - regex for replacement (with 'g' flag)
 *   replacement - text to replace matches with
 *   detect      - regex for validation detection (defaults to search without 'g')
 *   label       - human-readable description for validation (omitted => clean-only)
 */
const PLATFORM_PATTERNS = [
  { search: /Claude Code/g, replacement: 'coding assistant', detect: /\bClaude Code\b/i, label: 'contains "Claude Code" reference' },
  { search: /hooks\.json/g, replacement: 'hook-config.json', label: 'references "hooks.json" (platform-specific hook config)' },
  { search: /\$\{CLAUDE_PLUGIN_ROOT\}/g, replacement: 'PLUGIN_ROOT', priority: 10, label: 'references "${CLAUDE_PLUGIN_ROOT}" (platform-specific env var)' },
  { search: /\$CLAUDE_PLUGIN_ROOT/g, replacement: 'PLUGIN_ROOT', priority: 10, detect: /\$CLAUDE_PLUGIN_ROOT/, label: 'references "$CLAUDE_PLUGIN_ROOT" (platform-specific env var)' },
  { search: /\$CLAUDE_PROJECT_DIR/g, replacement: 'PROJECT_DIR', detect: /\$CLAUDE_PROJECT_DIR/, label: 'references "$CLAUDE_PROJECT_DIR" (platform-specific env var)' },
  { search: /\$CLAUDE_ENV_FILE/g, replacement: 'ENV_FILE', detect: /\$CLAUDE_ENV_FILE/, label: 'references "$CLAUDE_ENV_FILE" (platform-specific env var)' },
  { search: /\$CLAUDE_CODE_REMOTE/g, replacement: 'CODE_REMOTE', detect: /\$CLAUDE_CODE_REMOTE/, label: 'references "$CLAUDE_CODE_REMOTE" (platform-specific env var)' },
  { search: /\.claude\//g, replacement: '.agent/', detect: /\.claude\//i, label: 'references ".claude/" path (platform-specific directory)' },
  // Clean-only: broader .claude replacement for non-trailing-slash cases
  { search: /\.claude\b/g, replacement: '.agent' },
  { search: /\bclaude-code\b/g, replacement: 'coding-assistant', detect: /\bclaude-code\b/i, label: 'references "claude-code" (platform-specific CLI)' },
  { search: /\bclaude --/g, replacement: 'assistant --', detect: /\bclaude --/, label: 'references "claude --" (platform-specific CLI command)' },
  { search: /\bclaude-security-guidance\b/g, replacement: 'security-guidance', detect: /\bclaude-security-guidance\b/i, label: 'references "claude-security-guidance" (platform-specific filename)' },
  { search: /PLUGIN_ROOT\/hooks\//g, replacement: 'PLUGIN_ROOT/scripts/', priority: 20, detect: /PLUGIN_ROOT\/hooks\//, label: 'references "PLUGIN_ROOT/hooks/" (incorrect path, should be PLUGIN_ROOT/scripts/)' },
  // Clean-only: inline command interpolation !`cmd` -> bash instruction
  // Runs before @file pattern (priority 0 vs 30) so content inside !`cmd` is protected from @ neutralization
  { search: /!`([^`]+)`/g, replacement: '(Retrieve by running `$1` with your bash tool)', priority: 0 },
  { search: /(?<![-\w])cc --plugin-dir(?![-\w])/g, replacement: 'agent --plugin-dir', detect: /(?<![-\w])cc --plugin-dir(?![-\w])/, label: 'references "cc --plugin-dir" (platform-specific CLI flag)' },
  { search: /\/tmp\/claude\//g, replacement: '/tmp/agent/', detect: /\/tmp\/claude\//, label: 'references "/tmp/claude/" (platform-specific temp path)' },
  // @file reference: matches @path/to/file.ext where the path includes both a directory
  // separator (/) and a file extension (.). This avoids matching npm scoped packages
  // (@scope/name), version tags (@latest, @v1.2.3), model refs (@claude-3.5), email
  // addresses (user@example.com), and bare words (like @path inside !`cmd`).
  // Negative lookbehind (?<!\S) ensures @ is preceded by whitespace or line start.
  { search: /(?<!\S)@(\S+\/\S+\.\S+)/g, replacement: '(see $1)', priority: 30, detect: /(?<!\S)@\S+\/\S+\.\S+/, label: 'contains "@file" reference (path/to/file.ext — must have directory & extension)' },
  { search: /\bCLAUDE_PLUGIN_ROOT\b/g, replacement: 'PLUGIN_ROOT', priority: 11, detect: /\bCLAUDE_PLUGIN_ROOT\b/, label: 'references "CLAUDE_PLUGIN_ROOT" (platform-specific env var)' },
];

/**
 * Model-tier capability patterns and their neutral replacements.
 * These are provider-specific model tier references that should be neutralized
 * unless the skill is explicitly exempt (e.g., version migration skills).
 * Each entry:
 *   search      - regex for replacement (with 'g' flag)
 *   replacement - text to replace matches with
 *   detect      - regex for validation detection (defaults to search without 'g')
 *   label       - human-readable description for validation (omitted => clean-only)
 */
const MODEL_TIER_PATTERNS = [
  // Agent capability tier references
  { search: /\bhaiku\s+agent\b/gi, replacement: 'fast lightweight agent', priority: 20, detect: /\bhaiku\s+agent\b/i, label: 'references "haiku agent" (provider-specific model tier)' },
  { search: /\bsonnet\s+agent\b/gi, replacement: 'standard agent', priority: 20, detect: /\bsonnet\s+agent\b/i, label: 'references "sonnet agent" (provider-specific model tier)' },
  { search: /\bOpus\s+(?:bug\s+)?agent\b/g, replacement: 'high-capability agent', priority: 20, detect: /\bOpus\s+(?:bug\s+)?agent\b/, label: 'references "Opus agent" (provider-specific model tier)' },
  { search: /\bOpus\s+subagents?\b/g, replacement: 'high-capability subagents', priority: 20, detect: /\bOpus\s+subagents?\b/, label: 'references "Opus subagents" (provider-specific model tier)' },
  { search: /\bsonnet\s+agents\b/gi, replacement: 'standard agents', priority: 20, detect: /\bsonnet\s+agents\b/i, label: 'references "sonnet agents" (provider-specific model tier)' },

  // YAML model: values (provider-specific model tier in config)
  { search: /model:\s*haiku\b/gi, replacement: 'model: fast', priority: 20, detect: /model:\s*haiku\b/i, label: 'references "model: haiku" (provider-specific model tier)' },
  { search: /model:\s*sonnet\b/gi, replacement: 'model: standard', priority: 20, detect: /model:\s*sonnet\b/i, label: 'references "model: sonnet" (provider-specific model tier)' },
  { search: /model:\s*opus\b/gi, replacement: 'model: high-capability', priority: 20, detect: /model:\s*opus\b/i, label: 'references "model: opus" (provider-specific model tier)' },

  // Backtick-quoted model names (provider-specific model tier references)
  { search: /`haiku`/gi, replacement: '`fast`', priority: 20, detect: /`haiku`/i, label: 'references "`haiku`" (provider-specific model tier)' },
  { search: /`sonnet`/gi, replacement: '`standard`', priority: 20, detect: /`sonnet`/i, label: 'references "`sonnet`" (provider-specific model tier)' },
  { search: /`opus`/gi, replacement: '`high-capability`', priority: 20, detect: /`opus`/i, label: 'references "`opus`" (provider-specific model tier)' },

  // Enum sequences (provider-specific model tier value lists)
  { search: /inherit\/sonnet\/opus\/haiku/gi, replacement: 'inherit/standard/high-capability/fast', priority: 20, detect: /inherit\/sonnet\/opus\/haiku/i, label: 'references "inherit/sonnet/opus/haiku" (provider-specific model tier enum)' },
  { search: /inherit\|sonnet\|opus\|haiku/gi, replacement: 'inherit|standard|high-capability|fast', priority: 20, detect: /inherit\|sonnet\|opus\|haiku/i, label: 'references "inherit|sonnet|opus|haiku" (provider-specific model tier enum)' },
  { search: /sonnet,\s*opus,\s*haiku/gi, replacement: 'standard, high-capability, fast', priority: 20, detect: /sonnet,\s*opus,\s*haiku/i, label: 'references "sonnet, opus, haiku" (provider-specific model tier enum)' },

  // Versioned model prose references (Opus 4.7, Sonnet 4.5, Haiku 4.5)
  { search: /\bOpus\s+\d+\.\d+/g, replacement: 'high-capability model', priority: 20, detect: /\bOpus\s+\d+\.\d+/, label: 'references "Opus X.Y" (provider-specific model version)' },
  { search: /\bSonnet\s+\d+\.\d+/g, replacement: 'standard model', priority: 20, detect: /\bSonnet\s+\d+\.\d+/, label: 'references "Sonnet X.Y" (provider-specific model version)' },
  { search: /\bHaiku\s+\d+\.\d+/g, replacement: 'fast model', priority: 20, detect: /\bHaiku\s+\d+\.\d+/, label: 'references "Haiku X.Y" (provider-specific model version)' },

  // Bare model tier names (provider-specific references in prose, lists, and descriptions)
  // These match standalone haiku/sonnet/opus but NOT inside hyphenated API IDs like claude-opus-4-7
  // Negative lookbehind (?<!-) ensures we don't match the "opus" in "claude-opus-4-7"
  { search: /(?<!-)haiku\b/gi, replacement: 'fast', priority: 50, detect: /(?<!-)haiku\b/i, label: 'references "haiku" (provider-specific model tier)' },
  { search: /(?<!-)sonnet\b/gi, replacement: 'standard', priority: 50, detect: /(?<!-)sonnet\b/i, label: 'references "sonnet" (provider-specific model tier)' },
  { search: /(?<!-)opus\b/gi, replacement: 'high-capability', priority: 50, detect: /(?<!-)opus\b/i, label: 'references "opus" (provider-specific model tier)' },
];

/** Skills exempt from model-tier neutralization (their content is about specific model versions). */
const MODEL_TIER_EXEMPT_SKILLS = new Set(['claude-opus-4-5-migration']);

/** Known slash commands that should have their leading / stripped in neutralized output */
const SLASH_COMMANDS = [
  'commit', 'feature-dev', 'code-review', 'review-pr', 'hookify', 'mcp',
  'clean_gone', 'commit-push-pr', 'ralph-loop', 'cancel-ralph',
  'new-sdk-app', 'create-plugin', 'help',
];

const SLASH_COMMAND_REPLACE_REGEX = new RegExp(`\`/(${SLASH_COMMANDS.join('|')})([^\`]*)\``, 'g');
const SLASH_COMMAND_DETECT_REGEX = new RegExp(`\`/(${SLASH_COMMANDS.join('|')})`);

/**
 * Add a skill name to the model-tier exemption set at runtime.
 * Useful when the exemption list should be populated from frontmatter scanning.
 * @param {string} skillName
 */
function addModelTierExemption(skillName) {
  if (skillName) MODEL_TIER_EXEMPT_SKILLS.add(skillName);
}

/**
 * Clean and neutralize platform-specific content.
 * Replaces Claude Code references, hooks.json, $CLAUDE_PLUGIN_ROOT,
 * .claude/ paths, and slash commands with neutral equivalents.
 */
function cleanAndNeutralize(content, options = {}) {
  const { skillName, platformExempt } = options;
  const skipModelTier = (skillName && MODEL_TIER_EXEMPT_SKILLS.has(skillName)) || platformExempt === true;
  let cleaned = content;
  const sortedPlatform = [...PLATFORM_PATTERNS].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const p of sortedPlatform) {
    cleaned = cleaned.replace(p.search, p.replacement);
  }
  if (!skipModelTier) {
    const sortedModelTier = [...MODEL_TIER_PATTERNS].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    for (const p of sortedModelTier) {
      cleaned = cleaned.replace(p.search, p.replacement);
    }
  }
  cleaned = cleaned.replace(SLASH_COMMAND_REPLACE_REGEX, (match, cmd, rest) => `\`${cmd}${rest}\``);
  return cleaned;
}

/**
 * Find platform-neutrality violations in content.
 * Returns an array of human-readable issue descriptions.
 * Returns empty array if no violations found.
 */
function findNeutralityViolations(content, options = {}) {
  const { skillName, platformExempt } = options;
  const skipModelTier = (skillName && MODEL_TIER_EXEMPT_SKILLS.has(skillName)) || platformExempt === true;
  const issues = [];

  const sortedPlatform = [...PLATFORM_PATTERNS].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const p of sortedPlatform) {
    if (!p.label) continue;
    const detect = p.detect || new RegExp(p.search.source);
    if (detect.test(content)) {
      issues.push(p.label);
    }
  }

  if (!skipModelTier) {
    const sortedModelTier = [...MODEL_TIER_PATTERNS].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    for (const p of sortedModelTier) {
      if (!p.label) continue;
      const detect = p.detect || new RegExp(p.search.source);
      if (detect.test(content)) {
        issues.push(p.label);
      }
    }
  }

  if (SLASH_COMMAND_DETECT_REGEX.test(content)) {
    issues.push('contains slash commands (platform-specific CLI syntax)');
  }

  return issues;
}

module.exports = {
  cleanAndNeutralize,
  findNeutralityViolations,
  renamePath,
  addModelTierExemption,
  PLATFORM_PATTERNS,
  MODEL_TIER_PATTERNS,
};
