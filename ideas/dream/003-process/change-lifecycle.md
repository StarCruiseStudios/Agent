# Change lifecycle

**Layer:** 003, Process
**Status:** Proposed

Each [change](../002-concepts/change.md) in a proposal moves through the following states. A proposal has no state of its own beyond the states of its changes.

| State | Meaning |
|---|---|
| **Pending** | The change is waiting for a decision. |
| **Deferred** | The change is undecided and out of review until it is brought back. |
| **Rejected** | The change was declined, and its reasons are recorded. |
| **Approved** | The change was approved and is not yet published. |
| **Published** | The change is in effect. A change to an output has made a new current version or withdrawn the output. A publication to a project has placed its content in the project. |

A [version](../002-concepts/version.md) is superseded when a later published change replaces it. A superseded version stays in the history, and a [rollback](rollback.md) can return to it.
