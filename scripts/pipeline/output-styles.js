/**
 * Pipeline: Process Output Styles
 * Extracts additional context from output-style plugin session-start.sh scripts
 * and writes them as standalone skills.
 */

const fs = require('fs');
const path = require('path');
const { extractAdditionalContext } = require('../lib/context');
const { writeSkillMd } = require('../lib/skill-md');

const styles = [
  { plugin: 'explanatory-output-style', desc: 'Provides educational insights and explanations during code execution' },
  { plugin: 'learning-output-style', desc: 'Prompts users for lightweight contributions to encourage learning' },
];

/**
 * Process output style plugins by extracting their session-start.sh
 * additionalContext and writing them as skills.
 *
 * @param {string} pluginsDir    Path to the source plugins directory
 * @param {string} skillsDestDir Path to the destination skills directory
 */
function processOutputStyles(pluginsDir, skillsDestDir) {
  for (const style of styles) {
    const shPath = path.join(pluginsDir, style.plugin, 'hooks-handlers', 'session-start.sh');
    if (fs.existsSync(shPath)) {
      console.log(`Extracting additionalContext from output style: ${style.plugin}`);
      const prompt = extractAdditionalContext(shPath);
      if (prompt) {
        const destSkillDir = path.join(skillsDestDir, style.plugin);
        const title = style.plugin.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const body = `# ${title}\n\n${prompt}`;
        writeSkillMd(destSkillDir, style.plugin, style.desc, body);
      }
    }
  }
}

module.exports = { processOutputStyles };
