# Requirements: Link

**Layer:** 004, Requirements
**Status:** Draft

These requirements apply to [Link](../003-process/link.md), the step that derives associations between records.

---

**LNK-1. Every association follows from the facts of the records it relates.** Layer 002 defines an association as checkable against those records.

- For every association, the records it relates contain the facts that state the relationship.
- When the facts do not show whether records are related, no association between them exists.
- An association found by a fuzzy method, such as keyword matching or a semantic index, meets the same check as one found by an exact comparison.

**LNK-2. Link never changes a record, never judges, and never forms a question.** Layer 003 sets these limits.

- Running Link leaves every record's fact and metadata unchanged.
- Link holds no claim, support, finding, or question.

**LNK-3. Associations follow outdated records.** Layer 003 requires that the associations relating an outdated record are checked again.

- When a record is flagged as outdated, each association that relates it is checked again and revised where it no longer holds.
- Each revision keeps the earlier association in the history (principle 10).

**LNK-4. Link exposes every association it holds, whatever method found it.** Layer 003 sets this rule.

- Every association that Link holds is exposed to the steps above it.
- No association is withheld or marked differently because of the method that found it.
