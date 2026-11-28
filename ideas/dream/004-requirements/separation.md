# Requirements: Separation of steps

**Layer:** 004, Requirements
**Status:** Draft

These requirements keep the steps separate, as principle 19 and the [process overview](../003-process/overview.md) require.

---

**SEP-1. Any step can be replaced or rebuilt without changes to the steps beneath it.** This follows from principle 19.

- Replacing Link requires no change to Collect or to any record.
- Replacing Analyze requires no change to Link, Collect, or any association or record.
- Replacing Approve requires no change to Analyze, Collect, or what either one holds.
- Replacing exposure requires no change to Approve, Analyze, Collect, or what any of them holds.
- Discarding everything a step above Collect holds and rebuilding it requires only what the steps beneath it expose.

**SEP-2. A step never alters what a step beneath it holds.** This follows from principle 19, and layer 003 adds that only Collect writes records.

- No step other than Collect writes a record or changes a record's metadata.
- Only Link changes the associations it holds.
- Only Analyze changes the claims, findings, questions, and proposals it holds, and only Approve changes the decisions it holds.
- A step that needs a record checked again asks Collect to check it (COL-5).

**SEP-3. A step exposes everything that may be relevant, described by what it holds.** This follows from principle 19.

- What a step exposes describes its own knowledge and no method of any step above it.
- A step filters nothing out of what it exposes on an assumption about what a step above does or how that step works.
- What Collect exposes is the same whether Link exists or not, and what Link exposes is the same whether Analyze exists or not.

**SEP-4. A higher step reaches a lower one only as new facts.** Layer 003 sets this rule.

- Publications and decisions reach Analyze only through the records that Collect writes (COL-7).
- No step beneath another reads anything that a step above it holds.
- Collect records a published output from where agents load it, the same way it records any other existing knowledge, and it records a decision as user input given by the user.
