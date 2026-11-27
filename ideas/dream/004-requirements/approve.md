# Requirements: Approve

**Layer:** 004, Requirements
**Status:** Draft

These requirements apply to [Approve](../003-process/approve.md), the step that covers the decision on each change.

---

**APR-1. Nothing Archon publishes reaches agents without approval.** This follows from principle 12. Existing knowledge that Archon did not publish, such as a hand edit, is recorded as it is found (COL-7).

- Every version that Archon publishes has an approval decision that precedes it.
- Approving a change publishes it, and no change is published in any other way.

**APR-2. Each change is decided on its own.** Layer 002 and layer 003 set this rule.

- Every decision is one of approved, rejected, or deferred, and applies to one change.
- Two changes in the same proposal can receive different decisions.
- Every rejection records its reasons.
- A deferred change stays undecided until it is brought back to review.

**APR-3. A change can be reviewed against its evidence.** This follows from principle 2 and from layer 001, where a proposal is reviewed against the evidence it carries.

- For each change offered for a decision, its evidence, the support and frequency of the claims its findings rest on, and its proposed scopes with their origins can be seen.
- When a proposal carries a measurement of its effect, the measurement can be seen with the changes it concerns.

**APR-4. Approval sets applied scopes.** Layer 003 makes approval the point at which an output is applied to a scope.

- Every approved addition or revision has a set of applied scopes, each with an origin.

**APR-5. A proposed change is altered only by an edit made while deciding on it.** Layer 003 sets this rule.

- Every difference between a change as proposed and as approved is an edit recorded as user input and linked to the change.
- The edit is held with the decision, and the change as Analyze proposed it stays unchanged (principle 19).

**APR-6. An output has at most one current version.** Layer 002 defines this.

- Approving a revision makes its version current and marks the version it replaces as superseded.
- Approving a retirement leaves the output with no current version.

**APR-7. Every change is in one lifecycle state at a time.** Layer 003 defines the states of a change.

- At any time, each change is pending, deferred, rejected, approved, or taken back.
- A change takes effect only while it is approved.
- Every state a change has passed through can be found in the history (TRC-3).
