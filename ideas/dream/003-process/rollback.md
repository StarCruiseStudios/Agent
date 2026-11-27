# Rollback

**Layer:** 003, Process
**Status:** Proposed

A rollback takes back the approval of the [change](../002-concepts/change.md) that made an output's current [version](../002-concepts/version.md), and the output returns to the version it had before that change (principle 14). Taking back the approval of a retirement returns the output to the version it had before it was retired. Earlier versions are reached by taking back approvals one at a time.

Only the user rolls back an output. When a finding shows that a published output is wrong, Analyze proposes a revision or retirement of it (principle 15), and that proposal is decided like any other.

## Properties

- A rollback removes nothing from the history (principle 10). The change whose approval was taken back, and the version it made, stay in the history.
- A rollback is a decision on a change, so Collect records it as user input.
- A rollback is itself reversible. A change whose approval was taken back can be approved again, which makes its version current again.
