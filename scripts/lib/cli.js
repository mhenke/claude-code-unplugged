#!/usr/bin/env node

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

module.exports = { printUsage, parseArgs };
