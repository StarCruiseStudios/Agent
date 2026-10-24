# Planning instruction sets

The `plan-tracker` and `track-progress` skills and their stage agents are written to work in any repository with no configuration. A repository can tailor them by defining **instruction sets**: folders of Markdown that the orchestrator hands to each stage subagent alongside its generic instructions.

## Layout

```text
.agents/planning-instructions/
  default/                # optional; used when the user names no set
    README.md             # optional; what this set is for (not passed to agents)
    common.md             # optional; applies to every stage and to implementation
    research.md           # optional; one file per stage, all optional
    triage.md             # also applied to the orchestrator's quick direct/staged triage
    architecture.md
    phases.md
    plan.md
    implement.md          # applies while implementing under track-progress
  backend/
    common.md
    architecture.md
  security/
    research.md
    plan.md
```

- A set is any subfolder of `.agents/planning-instructions/`. Its name is the folder name: lowercase letters, digits, and hyphens.
- Every file in a set is optional. A missing file means "no extra instructions for that stage."
- `default` is the reserved name for the repo's default set.
- Files other than those listed are ignored by the workflow but may be referenced from them (for example `architecture.md` can say "follow the layering rules in `docs/layers.md`").

## Selection

| User says | Sets used |
| --- | --- |
| Nothing about instructions | `default` if it exists, otherwise none |
| One set, e.g. "plan this using the `backend` instructions" | `backend` only (`default` is **not** added) |
| Several sets, e.g. "instructions: `backend`, `security`" | `backend` then `security` |
| "No repo instructions" / "generic only" | None, even if `default` exists |

A set that wants to build on the default says so itself, for example with a first line in its `common.md`: "Also apply `.agents/planning-instructions/default/`." The orchestrator then includes `default`'s files for each stage before that set's files.

If a requested set does not exist, list the sets that do and ask the user. Never substitute another set silently.

The resolved list is recorded in every artifact's frontmatter and in the progress file (`plan.instruction_sets`), so a resumed planning or implementation session applies the same sets without the user restating them.

## What each stage receives

For stage `<stage>`, the subagent is told to read, in this order:

1. For each set in the resolved list, in order: `common.md`, then `<stage>.md`, where they exist.

The orchestrator applies `common.md` and `triage.md` for its quick direct-or-staged decision, and `common.md` and `plan.md` when it writes a direct plan itself. The implementing agent under `track-progress` reads `common.md` and `implement.md` from each set the same way.

## Precedence

1. The stage agent file's generic instructions are the baseline.
2. Instruction set files add to or override the baseline's *judgment calls*: what to research, which patterns to prefer, layering rules, file locations, naming, required validations, test commands, review gates, artifact sections to add.
3. Later sets override earlier ones where they conflict.
4. Instruction sets may **not** remove required artifact sections, skip the artifact frontmatter, or break the progress YAML schema. They may add sections, fields, and validations. If a set's instructions conflict with the artifact contract, the stage follows the contract and notes the conflict in its artifact.
5. The user's instructions in the current conversation override everything.

## Writing a good instruction set

- Write for a capable agent that already has the generic stage instructions. Say only what is specific to this repo or kind of work.
- Be concrete: real commands (`./gradlew check`), real paths (`services/*/src/main`), real names of patterns or modules to reuse.
- Keep each file short and scoped to its stage. Put cross-stage rules in `common.md`.
- Common uses of `common.md`: build and test commands, code review expectations.
- Common uses of `research.md`: areas or sources research must always cover (for example "always check `docs/adr/` for prior decisions").
- Common uses of `triage.md`: when a change may never be handled directly, and when architecture or phases are mandatory (for example "any change under `payments/` is staged and always runs architecture").
- Common uses of `plan.md` and `implement.md`: required validations per phase, commit conventions, changelog rules.

## Example

`.agents/planning-instructions/default/common.md`:

```markdown
Build with `npm run build`; test with `npm test`; lint with `npm run lint`.
Every phase's validations include `npm test` and `npm run lint`.
```

`.agents/planning-instructions/default/architecture.md`:

```markdown
Domain logic lives in `src/domain/` and must not import from `src/http/` or `src/db/`.
New external integrations get an interface in `src/domain/ports/` and an adapter in `src/adapters/`.
```
