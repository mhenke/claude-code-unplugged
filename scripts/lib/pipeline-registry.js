'use strict';

/**
 * Run a sequence of pipeline stages with error isolation.
 *
 * @param {Array<{ name: string, fn: (sourcePath: string, skillsDestDir: string) => void }>} stages
 * @param {string} sourcePath
 * @param {string} skillsDestDir
 * @returns {{ errors: Array<{ stage: string, error: Error }>, completed: string[] }}
 */
function runPipeline(stages, sourcePath, skillsDestDir) {
  const errors = [];
  const completed = [];

  for (const stage of stages) {
    console.log(`\n--- ${stage.name} ---`);
    try {
      stage.fn(sourcePath, skillsDestDir);
      completed.push(stage.name);
    } catch (err) {
      console.error(`ERROR in stage "${stage.name}": ${err.message}`);
      errors.push({ stage: stage.name, error: err });
    }
  }

  return { errors, completed };
}

module.exports = { runPipeline };
