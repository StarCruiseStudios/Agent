# Exposure

**Layer:** 003, Process
**Status:** Proposed

Exposure is how published outputs reach agents. It is not a step. The steps build knowledge when something starts them, and exposure is available to agents whenever they work. It builds on Approve, reads the tags of work from Collect and Analyze to tell which work an applied scope covers, and never alters what any of them holds (principle 19).

---

## Direct access

An agent can read the published [outputs](../002-concepts/output.md) whose applied [scopes](../002-concepts/scope.md) match its work, so an output reaches an agent's work only where approval has applied it (principle 9).

- Only the current version of a published output is offered. Superseded versions and retired outputs are never offered as current knowledge.
- Each output is given with its origin, so a user preference is never presented as a general rule (principle 9).
- Every supported agent works with the same set of published outputs (principle 18).
- Direct access never changes an output or Archon's internal knowledge. What agents do in their sessions reaches Archon only as facts that Collect records.
