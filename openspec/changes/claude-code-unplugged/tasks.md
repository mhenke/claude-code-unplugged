## 1. Setup and Project Layout

- [x] 1.1 Create the target directory structure for the standalone workspace
- [x] 1.2 Adopt zero-dependency plain JavaScript extraction script design (no package.json)

## 2. Extraction Utility Implementation

- [x] 2.1 Implement the CLI parsing in `scripts/extract.js` to handle `--source` and `--target` paths
- [x] 2.2 Implement direct skill copies for already existing skills (`frontend-design`, `claude-opus-4-5-migration`)
- [x] 2.3 Implement translation logic to merge and reformat command prompts and agent prompts into unified `SKILL.md` files
- [x] 2.4 Implement hook conversion logic to append validation checks to `SKILL.md` and copy supporting scripts to the skill's `scripts/` directory
- [x] 2.5 Implement issue management script migration, packaging files into `skills/github-management/scripts/` along with a `SKILL.md` file

## 3. Verification and Documentation

- [x] 3.1 Run the extraction script against the local workspace to verify the output folder structure
- [x] 3.2 Add the finalized repository documentation (`README.md`, `PROJECT-DESIGN.md`) to the target repository
- [x] 3.3 Validate the generated skills using a skills checker/validator to verify formatting and frontmatter metadata
