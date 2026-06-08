const fs = require('fs');

function extractAdditionalContext(shFilePath) {
  if (!fs.existsSync(shFilePath)) return '';
  const content = fs.readFileSync(shFilePath, 'utf8');
  const match = content.match(/cat << 'EOF'([\s\S]*?)EOF/);
  if (match) {
    try {
      const json = JSON.parse(match[1].trim());
      return json.hookSpecificOutput?.additionalContext || '';
    } catch (e) {
      console.warn(`Warning: Failed to parse JSON from ${shFilePath}:`, e.message);
    }
  }
  return '';
}

module.exports = { extractAdditionalContext };
