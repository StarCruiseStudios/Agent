# Finding lifecycle

**Layer:** 003, Process
**Status:** Proposed

A [finding](../002-concepts/finding.md) moves through the following states.

| State | Meaning |
|---|---|
| **Identified** | The finding has been identified and linked to evidence, and it is being checked against that evidence. |
| **Waiting** | The finding depends on a question that is still open. |
| **Holds up** | The finding holds up against its evidence, and it is being judged on whether it is worth proposing. |
| **Not proposed** | The finding holds up, and it was judged not worth proposing. It stays in internal knowledge with the reasons. |
| **Does not hold up** | The finding stays in internal knowledge with the reasons it did not hold up. |
| **Proposed** | A proposal has been made from the finding. |

A finding that holds up becomes proposed only when it is judged worth proposing, because a claim that holds up is not always worth placing in front of agents (principle 5). A waiting finding returns to identified once its question is answered or withdrawn. When a later run updates a finding with new evidence, the finding is checked again from identified, whatever state it was in. Every state a finding has passed through stays in the history (principle 10).
