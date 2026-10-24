---
name: plan-tracker
description: Run a staged planning workflow with a dedicated subagent per stage (research, triage, architecture, phases, plan), each writing an artifact to the repo that feeds the next. Simple changes are triaged up front and planned directly. Staged plans embed a progress-tracking YAML file so implementation can be interrupted and resumed by another session. Use when planning any change, or when asked to plan, design, scope, or break down work, optionally with a named set of repo planning instructions.
compatibility: Works with any agent that can read and write files. Uses a subagent facility (Agent/Task tool or equivalent) when available, and falls back to running each stage itself.
metadata:
  version: "3.0"
  dependencies: track-progress
---

# Plan Tracker

Plan a change through a sequence of stages. You are the **orchestrator**: you make a quick first call on whether the change is simple enough to plan directly, and otherwise you coordinate stage subagents. Each subagent gets its own instructions from this skill's `agents/` folder, writes one artifact into the plan folder, and hands off to the next stage through that artifact. A staged plan ends with the exact contents of a progress file that the `track-progress` skill maintains during implementation.

## Workflow at a glance

```text
1. Resolve instruction sets
2. Orchestrator quick triage ──► direct ──► Plan (orchestrator, direct mode, no progress YAML)
                              └► staged ──► Research (subagent)
                                            Triage (subagent): decides architecture / phases
                                            Architecture (subagent, if triage says run)
                                            Phases (subagent, if triage says run)
                                            Plan (subagent, with progress YAML)
3. Present the plan for approval
```

| # | Stage | Agent file | Artifact | Runs when |
| --- | --- | --- | --- | --- |
| 1 | Research | [agents/research.md](agents/research.md) | `01-research.md` | Staged route |
| 2 | Triage | [agents/triage.md](agents/triage.md) | `02-triage.md` | Staged route |
| 3 | Architecture | [agents/architecture.md](agents/architecture.md) | `03-architecture.md` | Triage says run |
| 4 | Phases | [agents/phases.md](agents/phases.md) | `04-phases.md` | Triage says run |
| 5 | Plan | [agents/plan.md](agents/plan.md) | `05-plan.md` | Always (by you in direct mode, by a subagent otherwise) |

Stages run strictly in this order. A later stage reads every earlier artifact that exists. Skipped stages leave no artifact, and later stages absorb their work at the depth the change needs.

## 1. Resolve the instruction sets

Repos can tailor every stage with their own instructions, kept separate from this skill. The full convention is in [references/instruction-sets.md](references/instruction-sets.md). In short:

- Instruction sets live in `.agents/planning-instructions/<set>/`, each holding optional per-stage files (`common.md`, `research.md`, `triage.md`, `architecture.md`, `phases.md`, `plan.md`, `implement.md`).
- If the user names one or more sets ("plan this with the `backend` instructions", "use `api, security`"), use exactly those, in the order given.
- If the user names none, use the `default` set when `.agents/planning-instructions/default/` exists.
- Otherwise use none. The workflow is complete without any repo instructions.
- If a named set does not exist, list the available sets and ask. Do not silently fall back.

Record the resolved list; every artifact and the progress file carry it so a resumed session uses the same sets.

## 2. Create or resume the plan folder

Each plan gets its own folder `.plans/<###>-<slug>/` at the repository root:

- `<###>` is a three-digit, zero-padded id, one greater than the highest id among existing folders in `.plans/` (start at `001`). Ids are never reused.
- `<slug>` is a short kebab-case name for the change, for example `.plans/007-http-client-retry/`.

To **resume**, use the folder the user points at, or an existing folder for this same change. Each artifact has frontmatter with `status: draft | complete`. Resume at the first stage that should run and whose artifact is missing or still `draft`. Do not rerun completed stages unless the user asks or an earlier artifact changed after them.

If the environment does not allow writing files during planning (for example a read-only plan mode), have each stage return its artifact text instead, carry the artifacts in the plan you present, and make writing them into the plan folder part of the first implementation step.

## 3. Quick triage (you)

Before launching anything, decide yourself whether the change is **direct** or **staged**. Read the request, apply the `common.md` and `triage.md` files of the resolved instruction sets (they may forbid direct handling for some areas), and look at just enough code to judge. Keep this to a few searches and file reads.

Choose **direct** only when all of these hold:
- The change is small and local: roughly one to three files, one obvious place to make it.
- The approach is clear from the request and a glance at the code, with nothing to investigate.
- No new abstractions, no public API, persistence, or cross-module contract changes.
- Low risk: no security, data-loss, or migration concerns.

Otherwise choose **staged**. When in doubt, choose staged. Tell the user your choice in one line with the reason.

### Direct route

Run the plan stage **yourself, without a subagent**: read [agents/plan.md](agents/plan.md) and follow its **Direct mode** section, applying each set's `common.md` and `plan.md`. Write `05-plan.md` to the plan folder. A direct plan has **no progress YAML** and no Step 0, and `track-progress` does not apply to it. Then go to step 5.

### Staged route

Run the stages below in subagents (step 4): research, then triage, then architecture and phases if triage says so, then plan.

## 4. Run each stage in a subagent

For each stage, in order:

1. **Launch a fresh subagent** (general-purpose type, or the host's equivalent). Its prompt is the full text of the stage's agent file followed by a context block:

   ```text
   ## Context
   Request: <the user's request, verbatim, plus anything they clarified since>
   Repository root: <absolute path>
   Plan folder: <path to .plans/<###>-<slug>/>
   Write your artifact to: <plan folder>/<artifact file>
   Prior artifacts (read all of these first): <paths, or "none">
   Instruction sets: <resolved list, or "none">
   Instruction files to apply (read and follow, in order): <paths of each set's common.md then <stage>.md that exist, or "none">
   Shared references: <absolute path to this skill's references/ folder>
   ```

   Pass paths, not pasted contents, so the subagent reads the current files. Give the subagent read access to the whole repo and write access to its artifact only. No stage modifies any other file.

2. **Wait for its result.** Each subagent returns a short summary, its artifact path, and any open questions, marked blocking or non-blocking.

3. **Check the artifact.** Open it and confirm it exists, has the required sections from its agent file, has `status: complete`, and is consistent with earlier artifacts. For research, also spot-check a few citations and make sure it reports facts only, with no recommendations or decisions. If an artifact falls short, send the subagent back with specific corrections (continue the same subagent when the host supports it) rather than fixing it yourself.

4. **Handle questions.** Ask the user any blocking questions before the next stage, then record their answers in the artifact's `Open questions` section (or have the subagent do so). Carry non-blocking questions forward; the plan stage lists any that remain.

After triage, read `02-triage.md`, run the stages it marks `run`, and tell the user in one line which ran and which were skipped. If the user wants a stage added or removed, update the triage artifact's stage table and follow it. The plan stage always runs.

**Without a subagent facility**, run each stage yourself, one at a time: read the agent file as if it were your only instructions, do that stage alone, write its artifact, then move on. Keep the stages separate; do not merge artifacts.

## 5. Present the plan

When `05-plan.md` is complete:

1. For a staged plan, verify the YAML block in the plan parses (use any available YAML parser; otherwise check it by reading) and that every phase, step, criterion, validation, and file in the plan prose appears in the YAML and vice versa.
2. Present the plan to the user: a short summary, the route and stages that ran, links to each artifact, and the plan itself. When the host has a formal plan-approval step (such as a plan mode), a staged plan you submit must include the progress YAML **verbatim**; the implementing agent copies it from there.
3. For a staged plan, make clear that implementation follows the `track-progress` skill and that its first step is creating `progress.yaml` in the plan folder from the YAML in the plan. For a direct plan, implementation simply follows the plan's steps and validations.

Do not start implementing until the user approves the plan.

## Artifact contract

Every artifact is Markdown with this frontmatter:

```yaml
---
stage: research             # research | triage | architecture | phases | plan
status: complete            # draft | complete
route: staged               # direct | staged
request: <one-line summary of the change>
instruction_sets: [default] # resolved list; [] when none
---
```

Artifacts cite code as `path:line` and never present guesses as facts. Each agent file defines its artifact's required sections. Repo instructions may add sections or fields but may not remove required ones or change the progress YAML schema in [references/progress-schema.md](references/progress-schema.md) beyond adding fields.

## Files in this skill

- [agents/](agents/): one instruction file per stage.
- [references/instruction-sets.md](references/instruction-sets.md): how repos define and select planning instruction sets.
- [references/progress-schema.md](references/progress-schema.md): the progress YAML schema, shared with `track-progress`.
