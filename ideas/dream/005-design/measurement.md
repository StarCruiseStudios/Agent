# Design: Measurement

**Layer:** 005, Technical design
**Status:** Draft

This file defines how Archon measures the effect of a change, as principle 16 sets as a core goal. It covers replaying comparable past tasks with and without a change before it is reviewed, and comparing covered work before and after a change is published. Measurement reads the namespaces of Approve, Analyze, Link, and Collect, keeps its own data in a namespace of its own through the [storage interface](storage.md), and runs its jobs in the [runtime host](runtime.md).

A [measurement](../002-concepts/measurement.md) shows what a change does and adds no support to any claim (MEA-2). A change can be decided whether or not it has been measured.

---

## Replay

A replay measures one or more changes by running agents on comparable past tasks in two arms.

| Arm | Knowledge loaded |
|---|---|
| **Baseline** | The current versions of published outputs, as they are when the replay runs. |
| **With the change** | The same knowledge with the change applied, rendered into managed files by the same rules that [Exposure](exposure.md) uses. |

### Task selection

A task is a past session with a repository snapshot taken at its start (MEA-1, CLD-5). The candidates are sessions in work that the change's proposed scopes cover, whose first user message is similar to the situation that the change's findings describe. Similarity comes from Link's content index.

The main set holds candidates that the change does not cite as evidence. Sessions that the change cites can be run as a second set, and their results are reported apart from the main set.

### Starting state

Each run starts from the recorded state of its task.

- **Code base.** A new git worktree is made in the Archon data directory from the snapshot's commit, and the snapshot's diff of uncommitted changes is applied to it. The user's own checkouts are never touched.
- **Knowledge.** Each run gets its own platform configuration home, such as `CLAUDE_CONFIG_DIR` for Claude Code and `CODEX_HOME` for Codex, holding exactly the knowledge of its arm.
- **Request.** The run is given the text of the task's first user message.

### Running

Each run is started through the [model gateway](model-access.md) as a registered use of the replay kind (MDA-2). The gateway starts the platform's command line tool in its non-interactive mode inside a container run by Docker or Podman, through WSL on Windows. The task's worktree and the run's configuration home are mounted into the container, the platform's command line tool is installed in its image, and the platform's login is made available to it. The agent's tools are on, so the agent can change files and run commands, and everything it does stays inside the container and its worktree.

Each task runs a configured number of times in each arm, because an agent does not act the same way twice. Every run's session is recorded by Collect, and the working directory it ran in marks it as a measurement run, a tag that the record's fact shows (COL-6).

Replays use the platform's subscription, so the gateway applies limits to them, set apart from the limits on judgment calls.

### Metrics

Each metric is computed with deterministic code from the run's session as Collect recorded it.

| Metric | What it counts |
|---|---|
| **Tests pass** | Whether the test commands the run executed passed, by Analyze's rules for test commands. |
| **Target failure** | Whether the error line or failing command that the change's findings concern occurred in the run. |
| **Effort** | Turns, tool calls, elapsed time, and the usage the platform reports. |
| **Prescribed step** | Whether the agent did what the change prescribes, where a rule can check it, such as searching for the consumers of a public interface before editing it. |

For each task and metric, the result gives the mean and range across runs in each arm and the difference between the arms. A metric that cannot be computed for a run is reported as missing, never as zero.

### What starts a replay

A replay runs when the user starts one for the changes to measure, from the [desktop app](user-surface.md) or with `archon measure`. It runs within the limits set for replays.

## After publication

Once a change is published, Measurement compares covered work before and after the date the change was published. It counts how often the target failure recurs, how often the user corrects agents on the same matter, and how often agents read the output through the MCP server, which appears in session records as tool-call events. This comparison uses deterministic code and runs no replays. It runs on a schedule as new sessions arrive.

## What Measurement keeps

Measurement's namespace holds each measurement with the changes it concerns and the records it was made from (MEA-2), each run with its task, arm, and session record, and each metric value. The user surface reads it when a change is decided (APR-3).

---

## Technical requirements

**MSD-1. A measurement adds no support.** This serves MEA-2.

- No session that carries the measurement tag is cited as evidence for any claim or finding.
- No claim's support counts a source rooted in a measurement run.

**MSD-2. Every measurement names the changes and records it rests on.** This serves MEA-2 and TRC-1.

- Every measurement links to each change it concerns.
- Every measurement links to the session records of its tasks and of every run.

**MSD-3. Every replayed task starts from its recorded state.** This serves MEA-1.

- Every run's worktree matches the snapshot's commit with its diff of uncommitted changes applied.
- Every run is given the text of its task's first user message.
- The knowledge loaded in each run is exactly the knowledge of its arm.

**MSD-4. A measurement can be seen when its changes are decided.** This serves APR-3 and MEA-2.

- The user surface shows every measurement of a change alongside the change when it is offered for a decision.
