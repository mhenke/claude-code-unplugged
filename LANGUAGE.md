# Architecture Vocabulary — Claude Code Unplugged

Shared vocabulary for architectural discussion, design review, and refactoring
decisions. Use these terms exactly — don't substitute "component," "service,"
"boundary," or "plugin." Consistent language is the whole point.

## Terms

### Module
Anything with an interface and an implementation. Scale-agnostic — applies
equally to a single function (`gates.buildGate`), a lib module
(`scripts/lib/files.js`), a pipeline stage (`scripts/pipeline/copy-direct.js`),
or the entire extraction pipeline.

In this project's code:
- Each file in `scripts/lib/` is a module — has exports (interface) and code
  (implementation)
- Each pipeline stage in `scripts/pipeline/` is a module — has an exported
  `run()` or `process()` function and internal logic
- Each skill under `skills/` is a module — its `SKILL.md` is the interface, its
  `scripts/`, `references/`, and `examples/` are the implementation

_Avoid:_ unit, component, service, plugin (reserved for the domain term "source
plugin")

### Interface
Everything a caller must know to use the module correctly. Includes the type
signature (exported functions, their parameters and return types), but also
invariants (files must be on disk already), ordering constraints (stages run
sequentially), error modes (what happens when validation fails), and
configuration (--source, --target flags).

Examples:
- `validate.js`'s interface: exits 0 if all SKILL.md files are valid, exits 1
  with stderr messages otherwise. Callers must know it reads from `skills/`.
- `files.js`'s interface: `copyDir(src, dest, opts)` where opts accepts a
  `transform` callback and a `mapDest` callback. Callers must know binary files
  bypass transform.
- A skill's interface: its `SKILL.md` frontmatter and description. Callers
  (users running `npx skills add`) must know only the skill name and what it
  does.

_Avoid:_ API, signature (too narrow — those refer only to the type-level
surface)

### Implementation
What's inside a module — its body of code. Everything not exposed through the
interface. Internal helper functions, private data structures, file I/O
details.

Distinct from **Adapter**: a pipeline stage can be a small adapter wrapping a
source directory format, or a complex adapter that merges 8 plugins into one
skill. Reach for "adapter" when the seam is the topic; "implementation"
otherwise.

### Depth
Leverage at the interface — how much behaviour a caller can exercise per unit
of interface they have to learn.

Deep modules in this project:
- **`frontmatter.js`** — 56 lines parse frontmatter, strip it, and normalize
  it. Interface: 3 exported functions. Depth: high — you get 3 operations for
  3 function signatures.
- **`gates.js`** — 88 lines build 6 verification gate variants from a single
  exported `buildGate(skillName)` function. Depth: high — one entry point, 6
  outputs.
- **`extract.js`** — 101-line orchestrator that delegates everything. Depth:
  low — its interface is nearly as complex as its implementation (calls 5
  stages). It's a coordinator, not a deep module.

Shallow modules (candidates for scrutiny):
- **`context.js`** — 18 lines, one exported function, does one thing. Depth is
  not the problem — it is narrow by design. Green.
- A pipeline stage that is mostly boilerplate calling lib functions would be
  shallow: interface roughly matches implementation length.

### Seam _(from Michael Feathers)_
A place where you can alter behaviour without editing in that place. The
*location* at which a module's interface lives.

Seams in this project:
- **`scripts/lib/` module exports** — the function signatures that pipeline
  stages call. Alter the orchestration by swapping which lib functions are
  called, not by editing the lib.
- **The `skills/` directory layout** — `SKILL.md` as interface, scripts/ as
  implementation. A user can alter behaviour by editing their installed copy of
  `SKILL.md` without touching the pipeline that produced it.
- **Pipeline stage registration** — adding or removing a stage from
  `extract.js` changes the pipeline without editing any stage's internal logic.

_Avoid:_ boundary (overloaded with DDD's bounded context)

### Adapter
A concrete thing that satisfies an interface at a seam. Describes *role* (what
slot it fills), not substance (what's inside).

Adapters in this project:
- Each pipeline stage module is an adapter for a source asset format. The
  `run(sourceDir, targetDir)` interface is satisfied by each stage differently:
  `copy-direct` copies with normalization, `merge-commands` merges 8 plugins,
  `output-styles` extracts from hooks.
- Each skill is an adapter for a human user's intent. The `npx skills add`
  interface surfaces behaviour through SKILL.md instructions.
- In tests, a mock filesystem (using `fs` stubs) is an adapter for the real
  filesystem.

### Leverage
What callers get from depth. More capability per unit of interface they have to
learn. One implementation pays back across N call sites and M tests.

In this project:
- `platform.js` is called by all 5 pipeline stages and `validate.js`. Its
  single `cleanAndNeutralize()` implementation pays back across 7 call sites.
- `frontmatter.js` is used during extraction, validation, and manifest
  generation. Callers learn 3 functions and get 6 use sites.

### Locality
What maintainers get from depth. Change, bugs, knowledge, and verification
concentrate at one place rather than spreading across callers. Fix once, fixed
everywhere.

In this project:
- The platform-neutrality rules live in **one** file (`platform.js`). Adding a
  new replacement pattern means editing one place, not 5 pipeline stages.
- The verification gate templates live in **one** file (`gates.js`). Adding a
  new gate variant means editing one map entry.
- Pipeline stage ordering lives in **one** file (`extract.js`). Reordering
  stages means editing one sequence.

## Principles

### Depth is a property of the interface, not the implementation.
A deep module can be internally composed of small, swappable parts — they just
aren't part of the interface. `gates.js` has internal helpers? Fine — tests
hit only `buildGate()`. `platform.js` has a compiled patterns list? Fine —
callers only see `cleanAndNeutralize()`.

### The deletion test.
Imagine deleting the module. If complexity vanishes, the module was a
pass-through. If complexity reappears across N callers, it was earning its
keep.

- Delete `context.js` — its one caller (`output-styles.js`) would need to
  inline 4 lines. Deletion cost: low. The module was narrow, not deep. Keep it
  for separation of concerns, not depth.
- Delete `platform.js` — every pipeline stage and validate.js would need its
  own neutralization logic replicated. Deletion cost: high. The module has
  true locality.
- Delete `extract.js` — the 5 stages would need an external orchestrator.
  Deletion cost: medium. The module is a thin coordinator — deleting it
  concentrates its 5 `require` calls and 5 `run()` invocations into whatever
  calls the stages.

### The interface is the test surface.
Callers and tests cross the same seam. `lib/` tests call exported functions.
Pipeline stage tests call `run()`. Skill tests invoke the instructions in
SKILL.md. If you want to test *past* the interface, the module is probably the
wrong shape.

### One adapter means a hypothetical seam. Two adapters means a real one.
Have only one library for shell context extraction? The seam is hypothetical.
Have two output style skills (explanatory + learning) from the same extraction
pattern? The seam is proven — that's why `output-styles.js` exists as a
generalized stage rather than an ad-hoc script.

## Relationships

- A **Module** has exactly one **Interface** (the surface it presents to
  callers and tests).
- A **Module** may contain internal **Seams** (used by its own tests) and an
  external **Seam** (its interface).
- **Depth** is a property of a **Module**, measured against its **Interface**.
- **Leverage** is what **Callers** get from **Depth**.
- **Locality** is what **Maintainers** get from **Depth**.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.

## Rejected framings

- **Depth as ratio of implementation-lines to interface-lines** (Ousterhout):
  rewards padding the implementation. We use depth-as-leverage instead.
- **"Interface" as the TypeScript `interface` keyword or a class's public
  methods**: too narrow — interface here includes every fact a caller must know
  (error formats, ordering, config).
- **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or
  **interface**.
- **"Plugin" used architecturally**: reserved for the domain term "source
  plugin" — the original Claude Code artifacts being extracted. Don't use it
  for modules, skills, or pipeline stages.

## Mapping to project structure

| Module Type | Example | Interface | Implementation |
|---|---|---|---|
| Shared lib | `scripts/lib/platform.js` | `cleanAndNeutralize(text)`, `findNeutralityViolations(text, filePath)` | 73 lines of regex patterns and string transforms |
| Pipeline stage | `scripts/pipeline/copy-direct.js` | `run(sourceDir, targetDir, shared), getReverseMapping()` | Directory walking, frontmatter normalization, file copying |
| Orchestrator | `scripts/extract.js` | Sequential invocation of 5 stages | Pipeline wiring, not business logic |
| Test module | `scripts/test/lib/platform.test.js` | 8 test cases exercising exported functions | Assertions against known text patterns |
| Skill | `skills/security-guidance/` | SKILL.md frontmatter + instruction body | scripts/ + .claude-plugin/ resources |
