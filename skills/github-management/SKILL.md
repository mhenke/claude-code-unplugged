---
name: github-management
description: Issue and pull request lifecycle automation scripts
---

# GitHub Management

This skill contains scripts for automating GitHub issue lifecycles, comments, labels, duplicate detection, and general repository sweep tasks.

## Available Scripts

The following scripts are located in the `scripts/` directory:
- `auto-close-duplicates.ts`: Copied from repository scripts.
- `backfill-duplicate-comments.ts`: Copied from repository scripts.
- `comment-on-duplicates.sh`: Copied from repository scripts.
- `edit-issue-labels.sh`: Copied from repository scripts.
- `gh.sh`: Copied from repository scripts.
- `issue-lifecycle.ts`: Copied from repository scripts.
- `lifecycle-comment.ts`: Copied from repository scripts.
- `sweep.ts`: Copied from repository scripts.


## Execution Guidelines
To run these scripts, use your bash command tool from the workspace root:
- For TypeScript files: `npx tsx scripts/<script-name>.ts`
- For Shell files: `bash scripts/<script-name>.sh`
