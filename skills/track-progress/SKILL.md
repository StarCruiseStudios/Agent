---
name: track-progress
description: Keep an implementation-progress YAML file (produced by the plan-tracker workflow) up to date while implementing a plan, and resume from it after an interruption. Use whenever implementing a plan that contains a progress file, or when asked to continue or resume such work.
metadata:
  dependencies: plan-tracker
---

# Track Progress

Use this skill while **implementing a staged plan** produced by the `plan-tracker` workflow. The plan lives in a plan folder `.plans/<###>-<slug>/` as `05-plan.md`, and progress is tracked in `progress.yaml` in the same folder. The schema is in the `plan-tracker` skill's [references/progress-schema.md](../plan-tracker/references/progress-schema.md). The goal is that a session can be interrupted at any moment and a fresh agent can pick up exactly where it left off, using only the plan folder and the repository.

Direct plans (`route: direct` in the plan's frontmatter) have no progress file; this skill does not apply to them. Implement them by following their steps and validation.

## Finding the plan

- If the user names a plan, folder, id (for example `007`), or progress file, use it.
- Otherwise look for `.plans/*/progress.yaml` whose `plan.status` is not `complete`. If exactly one exists, use it. If several exist, list them and ask. If none exists, look for a plan folder with a staged `05-plan.md` and no `progress.yaml`; that plan has not been started.

## Loading context

Before writing code, read:

1. `05-plan.md`, and the `03-architecture.md` and `01-research.md` artifacts when present. The plan says what to do; the earlier artifacts say why, and are the reference when a step is ambiguous.
2. The repo's instruction files for the instruction sets recorded in `plan.instruction_sets` (or in the plan's frontmatter if `progress.yaml` does not exist yet): for each set in order, `.agents/planning-instructions/<set>/common.md` and `implement.md`, where they exist. See the `plan-tracker` skill's [references/instruction-sets.md](../plan-tracker/references/instruction-sets.md). Use the recorded sets even if the user does not restate them. Follow them alongside this skill; they cannot relax the honesty rules below.

## Starting or resuming

1. **File does not exist yet:** create `progress.yaml` in the plan folder first, copying the YAML from the plan's "Progress file" section verbatim. If the plan's artifacts were carried in the plan text rather than written to the repo, write them into the plan folder now as well. Do no other implementation work before this.
2. **File exists:** read it fully before doing anything else. Then:
   - Read `plan.notes` and `plan.current` to find where to resume.
   - Trust the flags, but spot-check: for the in-progress step, inspect the listed files (`git status` / `git diff`) because the interrupted session may have done work it did not record. Reconcile the file with reality before continuing (e.g. mark a step `implemented: true` if its work is demonstrably complete; leave it `false` if only partly done and add a note describing the partial state).
3. Set `plan.status: in-progress` and update `plan.current` to the step you are about to do.

## While implementing

Update the file **immediately after each change**, not in batches and not at the end. A step is a checkpoint.

| Event | Update |
| --- | --- |
| Start a step | `plan.current` = that phase/step; `plan.status: in-progress` |
| Finish a step | step `implemented: true` |
| Finish writing/changing/deleting a file | that file's `implemented: true` |
| Phase's steps all done | phase `implemented: true` |
| Acceptance criterion confirmed | criterion `met: true` |
| Validation run and succeeded | validation `passed: true` |
| Phase's criteria all met and validations all passed | phase `verified: true`; file entries for the phase `verified: true` |
| Every phase implemented and verified | `plan.status: complete`; `plan.current` = null |
| Stuck or waiting on the user | `plan.status: blocked` and a note saying why and what is needed |

Always refresh `plan.updated` on every write.

### Honesty rules

- Only set a flag to `true` when it is actually true. Never mark validations `passed` without running them and seeing success; never mark criteria `met` on assumption.
- If a validation fails, leave it `false`, fix the problem, and re-run. If a previously `true` flag becomes false (a later change broke something), set it back to `false`.
- Do not delete or renumber ids.

### Deviations from the plan

Plans change. Record it in the file so the next session is not misled:

- New step needed: append it to the phase with a new unique id (e.g. `p2.s7`).
- Step no longer needed: keep it, add `obsolete: true` and a note; treat it as done for phase completion.
- Additional file touched: append it to `files` with `phase`, `change`, and flags.
- Anything surprising, or a decision made: append a short string to `plan.notes`.

### Resume hints

Before stopping for any reason, or when you notice context getting long, make sure `plan.current` points at the next unfinished step and add a note for any partial work (e.g. "p2.s3: function written, tests not yet added"). Keep notes terse and factual.

## Finishing

When all phases are `verified: true`, set `plan.status: complete`, then tell the user what was done and mention any open notes or deviations. Leave the progress file in place unless the user asks for it to be removed.
