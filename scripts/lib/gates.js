/**
 * Gate builders keyed by skill name.
 * Each returns the appended markdown string (starting with \n\n).
 */

function securityGate() {
  return `\n\n## 🔒 Pre-Execution Verification Gate\n\nBefore executing any commands, creating files, or editing code, you MUST output a structured XML \`<verification_gate>\` block evaluating the following checks:
1. \`secrets\`: Check for hardcoded API keys, secrets, credentials, or certificates. (PASS/FAIL)
2. \`input_sanitization\`: Check for unsafe user input handling (e.g., innerHTML, eval, unvalidated parameters). (PASS/FAIL)
3. \`paths\`: Check for path traversal vulnerabilities or directory escape attempts. (PASS/FAIL)

Example output format:
\`\`\`xml
<verification_gate>
  <secrets>PASS</secrets>
  <input_sanitization>PASS</input_sanitization>
  <paths>PASS</paths>
</verification_gate>
\`\`\`
Do not execute tools or code edits until you have output this verification gate.`;
}

function conventionsGate() {
  return `\n\n## 🔒 Pre-Execution Verification Gate\n\nBefore executing commands or submitting reviews, you MUST output a structured XML \`<verification_gate>\` block evaluating the following checks:
- \`conventions\`: All changes align with target guidelines. (PASS/FAIL)
- \`correctness\`: Verify code correctness and lack of logical bugs. (PASS/FAIL)

Example output format:
\`\`\`xml
<verification_gate>
  <conventions>PASS</conventions>
  <correctness>PASS</correctness>
</verification_gate>
\`\`\`
Do not proceed until you have output this verification gate.`;
}

function featureDevGate() {
  return `\n\n## 🔒 Phase Verification Gates\n\nBefore transitioning to a new phase in the feature development lifecycle, you MUST output a \`<phase_verification>\` XML block evaluating the current phase's success criteria.

Example:
\`\`\`xml
<phase_verification>
  <current_phase>Discovery</current_phase>
  <criteria_met>PASS</criteria_met>
</phase_verification>
\`\`\``;
}

function hookifyGate() {
  return `\n\n## 🔒 Hookify Cognitive Execution\n\nBefore executing any tools or modifying files, you MUST cognitively scan the workspace for Hookify rule files matching \`.agent/hookify.*.local.md\`.
For any matching rules:
1. Inspect the defined regex patterns and trigger conditions.
2. Verify that your planned tool execution or edits do not violate these rules.
3. Alternatively, execute the rule engine script to programmatically validate compliance:
   \`\`\`bash
   python3 scripts/rule_engine.py
   \`\`\``;
}

function ralphGate() {
  return `\n\n## 🔒 Ralph Self-Enforced Cognitive Loop\n\nYou are responsible for self-enforcing the Ralph feedback loop within this session:
1. Read the loop state file \`.agent/ralph-loop.local.md\` to extract current \`iteration\`, \`max_iterations\`, and \`completion_promise\`.
2. If the task is finished, output the exact promise tag: \`<promise>COMPLETION_PROMISE</promise>\` and delete the state file using your bash tool.
3. If \`max_iterations\` > 0 and \`iteration\` >= \`max_iterations\`, output a completion/termination message and delete the state file.
4. If the task is incomplete and iterations remain:
   - Increment the \`iteration\` count in the state file using your bash tool or file edits.
   - Output a summary of progress and ask the user to reply to continue the loop (self-blocking exit pattern). Do NOT exit or close the task until complete.`;
}

const GATE_BUILDERS = new Map([
  ['security-guidance', securityGate],
  ['commit-commands', conventionsGate],
  ['code-review', conventionsGate],
  ['feature-dev', featureDevGate],
  ['hookify', hookifyGate],
  ['ralph-wiggum', ralphGate],
]);

/**
 * Return the verification gate markdown for `skillName`, or '' if none defined.
 */
function buildGate(skillName) {
  const builder = GATE_BUILDERS.get(skillName);
  return builder ? builder() : '';
}

module.exports = { buildGate };
