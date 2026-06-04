#!/usr/bin/env node

/**
 * Claude Code Unplugged - Skills Extraction Utility
 * Extracts plugins, commands, and scripts from anthropics/claude-code
 * into flat Agent Skills format compatible with `npx skills add`.
 */

const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log(`
Usage:
  node scripts/extract.js --source <path-to-claude-code> --target <path-to-target>

Options:
  --source, -s  Path to the root of the source anthropics/claude-code repository
  --target, -t  Path to the output folder (claude-code-unplugged)
  --help, -h    Show this help message
`);
}

function parseArgs(args) {
  const options = {
    source: '',
    target: '',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--source' || arg === '-s') {
      options.source = args[++i];
    } else if (arg === '--target' || arg === '-t') {
      options.target = args[++i];
    }
  }

  return options;
}

// Helper to copy recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// Helper to parse frontmatter from markdown
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

// Helper to strip frontmatter
function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\r?\n/, '');
}

// Helper to write standard SKILL.md
function writeSkillMd(destDir, name, description, bodyContent) {
  fs.mkdirSync(destDir, { recursive: true });
  const mdContent = `---
name: ${name}
description: ${description}
---

${bodyContent.trim()}
`;
  fs.writeFileSync(path.join(destDir, 'SKILL.md'), mdContent, 'utf8');
}

// Helper to parse session start script output styles
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

// Helper to copy a direct skill and normalize its SKILL.md frontmatter name to match the skill folder slug
function copySkillNormalized(srcDir, destDir, skillName) {
  fs.mkdirSync(destDir, { recursive: true });
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    const srcItem = path.join(srcDir, item);
    const destItem = path.join(destDir, item);
    const stats = fs.statSync(srcItem);
    if (stats.isDirectory()) {
      copyRecursiveSync(srcItem, destItem);
    } else if (item === 'SKILL.md') {
      let content = fs.readFileSync(srcItem, 'utf8');
      const meta = parseFrontmatter(content);
      if (meta.name !== skillName) {
        console.log(`  Normalizing name: "${meta.name}" -> "${skillName}"`);
        content = content.replace(/^name:\s*.+$/m, `name: ${skillName}`);
      }
      fs.writeFileSync(destItem, content, 'utf8');
    } else {
      fs.copyFileSync(srcItem, destItem);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.source || !options.target) {
    console.error('Error: Both --source and --target paths must be specified.');
    printUsage();
    process.exit(1);
  }

  const sourcePath = path.resolve(options.source);
  const targetPath = path.resolve(options.target);

  console.log(`Starting extraction...`);
  console.log(`Source: ${sourcePath}`);
  console.log(`Target: ${targetPath}`);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source directory does not exist at "${sourcePath}"`);
    process.exit(1);
  }

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Target directory does not exist at "${targetPath}"`);
    process.exit(1);
  }

  const skillsDestDir = path.join(targetPath, 'skills');
  fs.mkdirSync(skillsDestDir, { recursive: true });

  // -------------------------------------------------------------
  // 1. Copy Direct Skills (Task 2.2)
  // -------------------------------------------------------------
  console.log('\n--- Copying Direct Skills ---');
  const pluginsDir = path.join(sourcePath, 'plugins');
  if (fs.existsSync(pluginsDir)) {
    const plugins = fs.readdirSync(pluginsDir);
    for (const plugin of plugins) {
      const skillPath = path.join(pluginsDir, plugin, 'skills');
      if (fs.existsSync(skillPath) && fs.statSync(skillPath).isDirectory()) {
        const skills = fs.readdirSync(skillPath);
        for (const skill of skills) {
          const srcSkill = path.join(skillPath, skill);
          const destSkill = path.join(skillsDestDir, skill);
          console.log(`Copying direct skill: ${skill} (from plugin: ${plugin})`);
          copySkillNormalized(srcSkill, destSkill, skill);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Merged Skills (Commands + Agents) (Task 2.3)
  // -------------------------------------------------------------
  console.log('\n--- Merging Commands and Agents ---');

  const mergedSkillsConfig = [
    { plugin: 'commit-commands', skill: 'commit-commands', title: 'Commit Workflows', defaultDesc: 'Git commit and repository workflows' },
    { plugin: 'code-review', skill: 'code-review', title: 'Code Reviewer', defaultDesc: 'Automated PR and code reviewer guidelines' },
    { plugin: 'feature-dev', skill: 'feature-dev', title: 'Feature Development', defaultDesc: 'Guided feature development workflow' },
    { plugin: 'pr-review-toolkit', skill: 'pr-review-toolkit', title: 'PR Review Toolkit', defaultDesc: 'Comprehensive code review toolkit' },
    { plugin: 'agent-sdk-dev', skill: 'agent-sdk-dev', title: 'Agent SDK Development', defaultDesc: 'Help developers build Agent SDK applications' },
    { plugin: 'plugin-dev', skill: 'plugin-dev', title: 'Plugin Development Helpers', defaultDesc: 'Development assistance for creating CLI plugins' },
    { plugin: 'hookify', skill: 'hookify', title: 'Hookify Extensions', defaultDesc: 'Extensible user-configured prompt hooks' },
    { plugin: 'ralph-wiggum', skill: 'ralph-wiggum', title: 'Ralph Feedback Loop', defaultDesc: 'Iterative feedback loop commands' }
  ];

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

    // If ralph-wiggum, copy its scripts folder as helper script
    if (config.plugin === 'ralph-wiggum') {
      const scriptSrc = path.join(pluginPath, 'scripts');
      if (fs.existsSync(scriptSrc)) {
        copyRecursiveSync(scriptSrc, path.join(destSkillDir, 'scripts'));
      }
    }
  }

  // -------------------------------------------------------------
  // 3. Translate Output Styles (Explanatory/Learning) (Task 2.3/2.4)
  // -------------------------------------------------------------
  console.log('\n--- Processing Output Styles ---');
  
  const styles = [
    { plugin: 'explanatory-output-style', desc: 'Provides educational insights and explanations during code execution' },
    { plugin: 'learning-output-style', desc: 'Prompts users for lightweight contributions to encourage learning' }
  ];

  for (const style of styles) {
    const shPath = path.join(pluginsDir, style.plugin, 'hooks-handlers', 'session-start.sh');
    if (fs.existsSync(shPath)) {
      console.log(`Extracting additionalContext from output style: ${style.plugin}`);
      const prompt = extractAdditionalContext(shPath);
      if (prompt) {
        const destSkillDir = path.join(skillsDestDir, style.plugin);
        const body = `# ${style.plugin.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}\n\n${prompt}`;
        writeSkillMd(destSkillDir, style.plugin, style.desc, body);
      }
    }
  }

  // -------------------------------------------------------------
  // 4. Translate Security Guidance Hooks (Task 2.4)
  // -------------------------------------------------------------
  console.log('\n--- Translating Security Guidance ---');
  const secPath = path.join(pluginsDir, 'security-guidance');
  if (fs.existsSync(secPath)) {
    const destSecDir = path.join(skillsDestDir, 'security-guidance');
    fs.mkdirSync(destSecDir, { recursive: true });

    // Copy .claude-plugin/plugin.json for internal python script version checking
    const pluginJsonSrc = path.join(secPath, '.claude-plugin', 'plugin.json');
    if (fs.existsSync(pluginJsonSrc)) {
      const destPluginJsonDir = path.join(destSecDir, '.claude-plugin');
      fs.mkdirSync(destPluginJsonDir, { recursive: true });
      fs.copyFileSync(pluginJsonSrc, path.join(destPluginJsonDir, 'plugin.json'));
      console.log('Copied security-guidance .claude-plugin/plugin.json for script compatibility.');
    }

    // Copy python/bash scripts to nested scripts/
    const hooksSrc = path.join(secPath, 'hooks');
    if (fs.existsSync(hooksSrc)) {
      const destScriptsDir = path.join(destSecDir, 'scripts');
      fs.mkdirSync(destScriptsDir, { recursive: true });
      
      const files = fs.readdirSync(hooksSrc);
      for (const file of files) {
        if (file !== 'hooks.json') {
          fs.copyFileSync(path.join(hooksSrc, file), path.join(destScriptsDir, file));
        }
      }
      console.log('Copied security helper scripts to scripts/ directory.');
    }

    // Build security SKILL.md
    let secReadme = '';
    const readmeFile = path.join(secPath, 'README.md');
    if (fs.existsSync(readmeFile)) {
      secReadme = fs.readFileSync(readmeFile, 'utf8').trim();
    }

    const secBody = `# Security Guidance

${secReadme}

---

## Pre-Execution Verification (PreToolUse)

Before executing commands, creating files, or editing code, you should review your work for common security pitfalls. You can run the built-in python script helper using your bash tool to scan files for dangerous patterns:

\`\`\`bash
python3 scripts/security_reminder_hook.py
\`\`\`

### Dangerous Patterns Checked
The pattern rules scanner checks for:
- Raw \`innerHTML\` usage (XSS vulnerability)
- Unsafe yaml/pickle serialization (\`yaml.load\`, \`pickle.load\` without restrictions)
- Unsafe PyTorch model loading (\`torch.load(weights_only=False)\`)
- Hardcoded api keys, secrets, and auth credentials
- SQL injections and shell command injection patterns
- Path traversal issues and unsafe file path operations

---

## Quality Verification Checklist (Stop / PostToolUse)

Upon completing code writing or editing:
1. Conduct a background review of your diff to check for vulnerability introductions.
2. If any changes touch critical web interfaces, ensure input validation is applied.
3. Review database commands to prevent auth bypass or IDOR.
4. Address or acknowledge any security warnings found during execution.
`;
    writeSkillMd(destSecDir, 'security-guidance', 'Security warnings, patterns scanner, and LLM diff security reviews', secBody);
  }

  // -------------------------------------------------------------
  // 5. Github Management Skill (Task 2.5)
  // -------------------------------------------------------------
  console.log('\n--- Packaging GitHub Management Skill ---');
  const sourceScriptsDir = path.join(sourcePath, 'scripts');
  if (fs.existsSync(sourceScriptsDir) && fs.statSync(sourceScriptsDir).isDirectory()) {
    const destMgmtDir = path.join(skillsDestDir, 'github-management');
    const destMgmtScripts = path.join(destMgmtDir, 'scripts');
    fs.mkdirSync(destMgmtScripts, { recursive: true });

    const scriptFiles = fs.readdirSync(sourceScriptsDir);
    let listContent = '';
    for (const file of scriptFiles) {
      fs.copyFileSync(path.join(sourceScriptsDir, file), path.join(destMgmtScripts, file));
      listContent += `- \`${file}\`: Copied from repository scripts.\n`;
    }
    console.log(`Copied ${scriptFiles.length} GitHub script utilities.`);

    const mgmtBody = `# GitHub Management

This skill contains scripts for automating GitHub issue lifecycles, comments, labels, duplicate detection, and general repository sweep tasks.

## Available Scripts

The following scripts are located in the \`scripts/\` directory:
${listContent}

## Execution Guidelines
To run these scripts, use your bash command tool from the workspace root:
- For TypeScript files: \`npx tsx scripts/<script-name>.ts\`
- For Shell files: \`bash scripts/<script-name>.sh\`
`;
    writeSkillMd(destMgmtDir, 'github-management', 'Issue and pull request lifecycle automation scripts', mgmtBody);
  }

  console.log('\nExtraction completed successfully!');
}

if (require.main === module) {
  main();
}
