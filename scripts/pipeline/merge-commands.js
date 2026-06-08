/**
 * Pipeline: Merge Commands and Agents
 * Merges plugin commands/ and agents/ directories into unified skill SKILL.md files,
 * replacing platform-specific syntax with neutral equivalents.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter, stripFrontmatter } = require('../lib/frontmatter');
const { cleanAndNeutralize } = require('../lib/platform');
const { writeSkillMd } = require('../lib/skill-md');
const { copyRecursiveSync } = require('../lib/files');

const mergedSkillsConfig = [
  { plugin: 'commit-commands', skill: 'commit-commands', title: 'Commit Workflows', defaultDesc: 'Git commit and repository workflows' },
  { plugin: 'code-review', skill: 'code-review', title: 'Code Reviewer', defaultDesc: 'Automated PR and code reviewer guidelines' },
  { plugin: 'feature-dev', skill: 'feature-dev', title: 'Feature Development', defaultDesc: 'Guided feature development workflow' },
  { plugin: 'pr-review-toolkit', skill: 'pr-review-toolkit', title: 'PR Review Toolkit', defaultDesc: 'Comprehensive code review toolkit' },
  { plugin: 'agent-sdk-dev', skill: 'agent-sdk-dev', title: 'Agent SDK Development', defaultDesc: 'Help developers build Agent SDK applications' },
  { plugin: 'plugin-dev', skill: 'plugin-dev', title: 'Plugin Development Helpers', defaultDesc: 'Development assistance for creating CLI plugins' },
  { plugin: 'hookify', skill: 'hookify', title: 'Hookify Extensions', defaultDesc: 'Extensible user-configured prompt hooks' },
  { plugin: 'ralph-wiggum', skill: 'ralph-wiggum', title: 'Ralph Feedback Loop', defaultDesc: 'Iterative feedback loop commands' },
];

/**
 * Merge commands and agents from plugins into unified skills.
 *
 * @param {string} pluginsDir    Path to the source plugins directory
 * @param {string} skillsDestDir Path to the destination skills directory
 */
function mergeCommandsAndAgents(pluginsDir, skillsDestDir) {
  for (const config of mergedSkillsConfig) {
    const pluginPath = path.join(pluginsDir, config.plugin);
    if (!fs.existsSync(pluginPath)) {
      console.log(`Skipping missing plugin: ${config.plugin}`);
      continue;
    }

    console.log(`Merging commands and agents for skill: ${config.skill}`);
    const destSkillDir = path.join(skillsDestDir, config.skill);
    fs.mkdirSync(destSkillDir, { recursive: true });

    let body = `# ${config.title}\n\n`;

    // Try reading README.md of the plugin
    const readmePath = path.join(pluginPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readme = fs.readFileSync(readmePath, 'utf8');
      body += `## Overview\n\n${readme.trim()}\n\n`;
    } else {
      body += `${config.defaultDesc}.\n\n`;
    }

    // Try merging commands
    const commandsPath = path.join(pluginPath, 'commands');
    if (fs.existsSync(commandsPath) && fs.statSync(commandsPath).isDirectory()) {
      body += `## Commands / Workflows\n\n`;
      const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const fileContent = fs.readFileSync(path.join(commandsPath, file), 'utf8');
        const meta = parseFrontmatter(fileContent);
        let commandBody = stripFrontmatter(fileContent);
        // Replace Claude Code CLI proprietary command interpolation syntax with general-purpose instruction
        commandBody = commandBody.replace(/!`([^`]+)`/g, '(Retrieve by running `$1` with your bash tool)');
        const name = path.basename(file, '.md');
        const desc = meta.description || 'No description provided.';

        body += `### Command: \`/${name}\`\n`;
        body += `*Description*: ${desc}\n\n`;
        body += `${commandBody.trim()}\n\n---\n\n`;
      }
    }

    // Try merging agents
    const agentsPath = path.join(pluginPath, 'agents');
    if (fs.existsSync(agentsPath) && fs.statSync(agentsPath).isDirectory()) {
      body += `## Specialized Subagent Personas\n\n`;
      const files = fs.readdirSync(agentsPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const fileContent = fs.readFileSync(path.join(agentsPath, file), 'utf8');
        const meta = parseFrontmatter(fileContent);
        let agentBody = stripFrontmatter(fileContent);
        // Replace Claude Code CLI proprietary command interpolation syntax with general-purpose instruction
        agentBody = agentBody.replace(/!`([^`]+)`/g, '(Retrieve by running `$1` with your bash tool)');
        const name = meta.name || path.basename(file, '.md');
        const desc = meta.description || 'Specialized development subagent.';

        body += `### Persona: \`${name}\`\n`;
        body += `*Description*: ${desc}\n\n`;
        body += `${agentBody.trim()}\n\n---\n\n`;
      }
    }

    // Write merged file
    writeSkillMd(destSkillDir, config.skill, config.defaultDesc, body);

    // If ralph-wiggum, copy its scripts folder and hooks folder as helper scripts
    if (config.plugin === 'ralph-wiggum') {
      const scriptSrc = path.join(pluginPath, 'scripts');
      if (fs.existsSync(scriptSrc)) {
        copyRecursiveSync(scriptSrc, path.join(destSkillDir, 'scripts'), {
          transform: (content) => cleanAndNeutralize(content),
        });
      }
      const hooksSrc = path.join(pluginPath, 'hooks');
      if (fs.existsSync(hooksSrc)) {
        copyRecursiveSync(hooksSrc, path.join(destSkillDir, 'scripts'), {
          transform: (content) => cleanAndNeutralize(content),
        });
      }
    }

    // If hookify, copy hooks/, core/, and examples/ as helper scripts/examples
    if (config.plugin === 'hookify') {
      const hooksSrc = path.join(pluginPath, 'hooks');
      if (fs.existsSync(hooksSrc)) {
        copyRecursiveSync(hooksSrc, path.join(destSkillDir, 'scripts'), {
          transform: (content) => cleanAndNeutralize(content),
        });
      }
      const coreSrc = path.join(pluginPath, 'core');
      if (fs.existsSync(coreSrc)) {
        copyRecursiveSync(coreSrc, path.join(destSkillDir, 'scripts', 'core'), {
          transform: (content) => cleanAndNeutralize(content),
        });
      }
      const examplesSrc = path.join(pluginPath, 'examples');
      if (fs.existsSync(examplesSrc)) {
        copyRecursiveSync(examplesSrc, path.join(destSkillDir, 'examples'), {
          transform: (content) => cleanAndNeutralize(content),
        });
      }
    }
  }
}

module.exports = { mergeCommandsAndAgents };
