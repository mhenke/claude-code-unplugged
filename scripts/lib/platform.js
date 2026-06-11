/**
 * Platform-specific pattern detection and neutralization.
 * Single source of truth for all platform-neutrality operations.
 */

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
  { search: /\$\{CLAUDE_PLUGIN_ROOT\}/g, replacement: 'PLUGIN_ROOT', label: 'references "${CLAUDE_PLUGIN_ROOT}" (platform-specific env var)' },
  { search: /\$CLAUDE_PLUGIN_ROOT/g, replacement: 'PLUGIN_ROOT', detect: /\$CLAUDE_PLUGIN_ROOT/, label: 'references "$CLAUDE_PLUGIN_ROOT" (platform-specific env var)' },
  { search: /\$CLAUDE_PROJECT_DIR/g, replacement: 'PROJECT_DIR', detect: /\$CLAUDE_PROJECT_DIR/, label: 'references "$CLAUDE_PROJECT_DIR" (platform-specific env var)' },
  { search: /\$CLAUDE_ENV_FILE/g, replacement: 'ENV_FILE', detect: /\$CLAUDE_ENV_FILE/, label: 'references "$CLAUDE_ENV_FILE" (platform-specific env var)' },
  { search: /\$CLAUDE_CODE_REMOTE/g, replacement: 'CODE_REMOTE', detect: /\$CLAUDE_CODE_REMOTE/, label: 'references "$CLAUDE_CODE_REMOTE" (platform-specific env var)' },
  { search: /\.claude\//g, replacement: '.agent/', detect: /\.claude\//i, label: 'references ".claude/" path (platform-specific directory)' },
  // Clean-only: broader .claude replacement for non-trailing-slash cases
  { search: /\.claude\b/g, replacement: '.agent' },
  { search: /\bclaude-code\b/g, replacement: 'coding-assistant', detect: /\bclaude-code\b/i, label: 'references "claude-code" (platform-specific CLI)' },
  { search: /\bclaude --/g, replacement: 'assistant --', detect: /\bclaude --/, label: 'references "claude --" (platform-specific CLI command)' },
  { search: /\bclaude-security-guidance\b/g, replacement: 'security-guidance', detect: /\bclaude-security-guidance\b/i, label: 'references "claude-security-guidance" (platform-specific filename)' },
  { search: /PLUGIN_ROOT\/hooks\//g, replacement: 'PLUGIN_ROOT/scripts/', detect: /PLUGIN_ROOT\/hooks\//, label: 'references "PLUGIN_ROOT/hooks/" (incorrect path, should be PLUGIN_ROOT/scripts/)' },
];

/** Known slash commands that should have their leading / stripped in neutralized output */
const SLASH_COMMANDS = [
  'commit', 'feature-dev', 'code-review', 'review-pr', 'hookify', 'mcp',
  'clean_gone', 'commit-push-pr', 'ralph-loop', 'cancel-ralph',
  'new-sdk-app', 'create-plugin', 'help',
];

const SLASH_COMMAND_REPLACE_REGEX = new RegExp(`\`/(${SLASH_COMMANDS.join('|')})([^\`]*)\``, 'g');
const SLASH_COMMAND_DETECT_REGEX = new RegExp(`\`/(${SLASH_COMMANDS.join('|')})`);

/**
 * Clean and neutralize platform-specific content.
 * Replaces Claude Code references, hooks.json, $CLAUDE_PLUGIN_ROOT,
 * .claude/ paths, and slash commands with neutral equivalents.
 */
function cleanAndNeutralize(content) {
  let cleaned = content;
  for (const p of PLATFORM_PATTERNS) {
    cleaned = cleaned.replace(p.search, p.replacement);
  }
  cleaned = cleaned.replace(SLASH_COMMAND_REPLACE_REGEX, (match, cmd, rest) => `\`${cmd}${rest}\``);
  return cleaned;
}

/**
 * Find platform-neutrality violations in content.
 * Returns an array of human-readable issue descriptions.
 * Returns empty array if no violations found.
 */
function findNeutralityViolations(content) {
  const issues = [];

  for (const p of PLATFORM_PATTERNS) {
    if (!p.label) continue;
    const detect = p.detect || new RegExp(p.search.source);
    if (detect.test(content)) {
      issues.push(p.label);
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
};
