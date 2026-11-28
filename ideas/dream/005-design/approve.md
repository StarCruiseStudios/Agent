# Design: Approve

**Layer:** 005, Technical design
**Status:** Draft

This file defines how [Approve](../003-process/approve.md) takes in proposed changes, applies the user's decisions, keeps versions of outputs, handles existing knowledge that the user edits by hand, and rolls back. Approve reads Analyze's and Collect's namespaces and keeps its own data in its own namespace through the [storage interface](storage.md), and it runs its jobs in the [runtime host](runtime.md).

---

## Change intake

A job started by new writes in Analyze's namespace registers each newly proposed change as **pending**. Approve copies the fields of the change that it needs: its kind, the output it concerns, its content, its proposed scopes with their origins, and, for a revision or a retirement, its **base**, the record in Collect's namespace of the version it was drafted against. A base is current when that record shows the output's current version, by the version ID labeled in it or, for existing knowledge that Archon did not publish, by being the record of the current version. The change in Analyze's namespace stays as Analyze proposed it (APR-5).

## Decision path

Every decision reaches Approve as user input that Collect records.

1. The user surface sends a decision to the service, and Collect writes it as a user-input record exactly as the user gave it, with its reasons and any edits made while deciding (COL-4, COL-7).
2. A job started by new writes in Collect's namespace reads the record and applies the decision. It writes the decision with a link to the record, any new version or retirement, the current version of the output, and the change's new state.

A decision is one of approved, rejected, or deferred, and it applies to one change (APR-2). Bringing a deferred change back to review is also a decision, and it returns the change to pending. A decision that cannot apply, such as one that names a change that is already rejected, is recorded as not applied with its reason, and no state changes.

Because every decision is a user-input record in Collect, Approve can be dropped and rebuilt by applying Collect's decision records, in order, to the changes in Analyze's namespace (SEP-1).

## Versions

| Change | What approving it does |
|---|---|
| **Addition** | Creates the output with a new ID and makes its first version current. |
| **Revision** | Adds a new version, makes it current, and marks the version it replaces as superseded (APR-6). |
| **Retirement** | Leaves the output with no current version. |

Each version holds its content, its applied scopes with the origin of each, and the change that made it. The applied scopes are the change's proposed scopes, unless the user edited them while deciding (APR-4). Content edited while deciding becomes the version's content, and the edit stays with the decision.

## Existing knowledge

Every piece of existing knowledge that Collect records is an output in Approve's namespace, and its first record is its first current version, whether or not Archon published it (OUT-3). A change can revise or retire a piece of existing knowledge, such as a hand-written instruction file, an agent's built-in memory, or a skill. The current version of such an output is the latest of two things: the last version Approve made current, and the latest existing-knowledge record that Collect holds for the output's location. A hand edit is recorded by Collect, so a hand edit made after an approval is the newer version. A record whose content is the content of the version Approve made current, such as the record Collect makes after Exposure writes that version, is a record of that version and not a hand edit.

An approval of a revision or a retirement applies only when the change's base is still the output's current version. When the base is no longer current, the decision is recorded as not applied because the base changed, and the change stays pending. Analyze sees the record of the hand edit as new evidence beneath the change.

## Rollback

Taking back an approval applies only to the change that made the output's current version (REV-1). The version before that change becomes current again, and taking back the approval of a retirement makes current the version the output had before it was retired. The change moves to **taken back**, and nothing is removed from the history (REV-2). A taken-back change can be approved again, which makes its version current again.

When the current version of an output is a hand edit, no approval made it current, so there is nothing to take back. The user edits the knowledge again by hand, and Collect records the edit.

## What Approve exposes

Approve exposes everything in its namespace through read handles: decisions with their links to user input, outputs, every version with its applied scopes and origins, the current version of each output, and every state each change has passed through. Exposure builds on what Approve exposes, and it is what makes current versions available to agents, including writing approved content to the location of a piece of existing knowledge.

---

## Technical requirements

**APD-1. Every decision traces to a user-input record.** This serves APR-1, REV-3, and TRC-1.

- Every decision in Approve's namespace links to the user-input record in Collect's namespace that it applied.
- No version that Archon publishes becomes current, and no change changes state, without such a decision.

**APD-2. Approve can be rebuilt from Collect and Analyze.** This serves SEP-1.

- Dropping Approve's namespace and applying Collect's decision records in order to Analyze's changes yields the same decisions, versions, current versions, and change states.

**APD-3. An approval over a changed base does not apply.** This serves APR-6 and REV-1.

- When the base of a revision or retirement is not the output's current version, approving it leaves the output's current version unchanged and the change pending.
- The decision is recorded as not applied, with the reason that the base changed.

**APD-4. Rollback reaches only the change that made the current version.** This serves REV-1 and REV-2.

- Taking back an approval of a change that did not make the output's current version is recorded as not applied.
- Taking back approvals one at a time, with no hand edit between them, reaches every earlier version that Approve made current.

**APD-5. The change as proposed is never altered.** This serves APR-5.

- Every edit made while deciding is held with the decision and its user-input record.
- The change in Analyze's namespace is the same before and after any decision on it.
