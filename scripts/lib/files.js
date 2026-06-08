const fs = require('fs');
const path = require('path');

const TEXT_EXTENSIONS = new Set(['.js', '.ts', '.py', '.sh', '.md', '.json']);

/**
 * Recursively copy src to dest with optional transform and mapDest callbacks.
 * @param {string} src
 * @param {string} dest
 * @param {object} [opts]
 * @param {function} [opts.transform] - (content: string, srcPath: string) => string, applied to text files
 * @param {function} [opts.mapDest] - (destPath: string, srcPath: string) => string, override destination path
 */
function copyRecursiveSync(src, dest, opts = {}) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
        opts
      );
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const ext = path.extname(src);
    if (TEXT_EXTENSIONS.has(ext)) {
      let content = fs.readFileSync(src, 'utf8');
      if (opts.transform) {
        content = opts.transform(content, src);
      }
      // Apply mapDest for destination path override
      let finalDest = dest;
      if (opts.mapDest) {
        finalDest = opts.mapDest(dest, src);
      }
      fs.writeFileSync(finalDest, content, 'utf8');
    } else {
      // For binary files, still apply mapDest
      let finalDest = dest;
      if (opts.mapDest) {
        finalDest = opts.mapDest(dest, src);
      }
      fs.mkdirSync(path.dirname(finalDest), { recursive: true });
      fs.copyFileSync(src, finalDest);
    }
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

module.exports = { copyRecursiveSync, ensureDir };
