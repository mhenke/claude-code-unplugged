#!/usr/bin/env node

function printUsage() {
  console.log(`
Usage:
  node scripts/extract.js --source <path-to-claude-code> --target <path-to-target> [--commit <sha>]

Options:
  --source, -s  Path to the root of the source anthropics/claude-code repository
  --target, -t  Path to the output folder (claude-code-unplugged)
  --commit, -c  Git commit SHA of the source (optional; use "auto" to detect from --source git repo)
  --help, -h    Show this help message
`);
}

function parseArgs(args) {
  const options = {
    source: '',
    target: '',
    commit: '',
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
    } else if (arg === '--commit' || arg === '-c') {
      options.commit = args[++i];
    }
  }

  return options;
}

module.exports = { printUsage, parseArgs };
