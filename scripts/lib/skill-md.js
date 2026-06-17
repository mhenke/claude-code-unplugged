const fs = require('fs');
const path = require('path');
const { cleanAndNeutralize } = require('./platform');
const { buildGate } = require('./gates');

/**
 * Write a SKILL.md file to destDir.
 * Neutralizes body content, appends verification gate if one exists for `name`,
 * and writes the file with normalized frontmatter.
 */
function writeSkillMd(destDir, name, description, bodyContent) {
  fs.mkdirSync(destDir, { recursive: true });

  let processedBody = cleanAndNeutralize(bodyContent, { skillName: name });

  const gateText = buildGate(name);
  if (gateText) {
    processedBody += gateText;
  }

  const mdContent = `---
name: ${name}
description: ${cleanAndNeutralize(description, { skillName: name })}
---

${processedBody.trim()}
`;
  fs.writeFileSync(path.join(destDir, 'SKILL.md'), mdContent, 'utf8');
}

module.exports = { writeSkillMd };
