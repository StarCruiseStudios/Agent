# Rollback

**Layer:** 003, Process
**Status:** Proposed

A rollback is a revision that returns an output to an earlier [version](../002-concepts/version.md) (principle 14). It can also undo a [publication to a project](exposure.md#publishing-to-a-project). Analyze can propose a rollback when a finding shows that a published output is wrong, and the user can ask for one directly.

## Properties

- A rollback adds a new current version and removes nothing from the history (principle 10).
- A rollback is itself reversible, like any other revision.
