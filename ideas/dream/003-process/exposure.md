# Exposure

**Layer:** 003, Process
**Status:** Proposed

Exposure is how published outputs reach agents. It is not a step. The steps build knowledge when something starts them, and exposure is available to agents whenever they work. It builds on Approve and never alters what Approve holds (principle 19).

Published outputs reach agents in two ways. An agent can work with them directly through Archon, or an output can be published into a project's own files so that agents load it from there without Archon.

---

## Direct access

An agent can read the published [outputs](../002-concepts/output.md) whose applied [scopes](../002-concepts/scope.md) match its work, so an output reaches an agent's work only where approval has applied it (principle 9).

- Only the current version of a published output is offered. Superseded versions and retired outputs are never offered as current knowledge.
- Each output is given with its origin, so a user preference is never presented as a general rule (principle 9).
- Every supported agent works with the same set of published outputs (principle 18).
- Direct access never changes an output or Archon's internal knowledge. What agents do in their sessions reaches Archon only as facts that Collect records.

## Publishing to a project

An output can be published into a project's own files or an agent's built-in rules, such as a hand-written instruction file. Once it is published there, it belongs to the project, and agents load it from there without needing Archon.

Publishing to a project is a [change](../002-concepts/change.md) of its own, because it alters what agents load (principle 12).

- A publication to a project never overwrites an edit made there outside Archon.
- What is published into a project is recorded by Collect as existing knowledge, like anything else agents load.
- Every publication to a project is traceable to the version it placed and to the change that approved it (principle 2).
- A publication to a project can be undone on its own, apart from the output it placed (principle 14).
