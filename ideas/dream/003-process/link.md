# Step: Link

**Layer:** 003, Process
**Status:** Proposed

Link finds which [records](../002-concepts/record.md) are related and defines how they relate, so that later steps can work on related records together instead of on each record alone. It captures [associations](../002-concepts/association.md), which are factual relationships derived directly from the records, and it goes no further than the facts do. Connections that require judgment belong to [Analyze](analyze.md). When the facts do not show whether records are related, Link records no association and forms no question.

Link builds only on what Collect exposes (principle 19). It exposes every association it holds to the steps above it, whatever method found the association.

## Properties

- A new record is associated against the whole set of records, and associations made earlier are not rebuilt because a new record arrived (principle 11).
- Associations are Link's own knowledge. They refer to records and never alter them, so Link can be changed or rebuilt, and every association discarded and found again, without any change to Collect.
- When a record is flagged as outdated, the associations that relate it are checked again and revised where they no longer hold. Every revision is kept in the history (principle 10).
- Link never judges claims, support, or findings, because those are inferences and belong to [Analyze](analyze.md).
