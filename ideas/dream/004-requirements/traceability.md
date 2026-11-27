# Requirements: Traceability and history

**Layer:** 004, Requirements
**Status:** Draft

These requirements make every output traceable to its evidence, as principle 2 requires, and keep the history, as principle 10 requires.

---

**TRC-1. Every version traces back to records and user input.** This follows from principle 2 and from layer 003, where each step in the chain from records to versions is traceable in reverse.

- From any version that Archon published, the links lead to the change that approved it, to the findings that change rests on, and to the evidence of each finding.
- Every version of existing knowledge that Archon did not publish traces to the record that captured it.
- Every trace ends at observations in records or at user input, and none ends at an inference alone.
- Every rollback traces to the user input that took back the approval and to the change it concerns.

**TRC-2. User input stays identifiable along every trace.** This follows from the definitions of support and user input in layer 002.

- Every piece of evidence that is user input is marked as user input wherever it is cited.

**TRC-3. Every revision is kept.** This follows from principle 10.

- Every revision to record metadata, internal knowledge, or outputs is recorded, together with what it replaced.
- Superseded versions, rejected, deferred, and taken-back changes, findings that did not hold up or were not proposed, and withdrawn questions all stay in the history with their reasons.
- Every state that a finding or a change has passed through can be found in the history.
