# Requirements: Reversibility

**Layer:** 004, Requirements
**Status:** Draft

These requirements make every published change reversible, as principle 14 requires, through the [rollback](../003-process/rollback.md) that layer 003 defines.

---

**REV-1. Any output can be returned to any of its earlier versions on its own.** This follows from principle 14 and from the definition of a rollback in layer 003.

- Taking back the approval of the change that made an output's current version makes the version before that change current again.
- Taking back approvals one at a time reaches every earlier version of the output.
- Taking back the approval of a retirement returns the output to the version it had before it was retired.
- Rolling back one output leaves every other output unchanged.

**REV-2. A rollback removes nothing.** Layer 003 sets this rule.

- After a rollback, the change whose approval was taken back, the version it made, and every earlier version stay in the history.
- A change whose approval was taken back can be approved again, which makes its version current again.

**REV-3. Only the user rolls back an output.** Layer 003 sets this rule.

- Every rollback is a decision by the user, recorded as user input (COL-7).
- Analyze never rolls back an output. When a finding shows that a published output is wrong, Analyze proposes a revision or retirement (ANL-8).
