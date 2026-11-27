# Step: Analyze

**Layer:** 003, Process
**Status:** Proposed

Analyze is where Archon interprets what it has recorded. Link states what the facts show about one another, and Analyze looks for the more abstract connections that require judgment. It works on records, the associations between them, and its own earlier work. From these it derives [claims](../002-concepts/claim.md) and [inferences](../002-concepts/inference.md), including [tags](../002-concepts/tag.md) that need judgment and who wrote each piece of existing knowledge. It identifies [findings](../002-concepts/finding.md), forms [questions](questions.md), and turns findings that hold up and are worth proposing into [proposals](../002-concepts/proposal.md). Before it cites a record that can stop holding, it can ask [Collect](collect.md) to check that record again.

Everything agents load is recorded by Collect as existing knowledge, including the outputs that Archon has published. Analyze therefore sees published outputs the same way it sees any other fact, and it needs nothing from the steps above it.

## Keeping published knowledge current

Every published change rests on findings, and every finding rests on records and associations. When something beneath a finding changes, such as a record flagged as outdated, an association revised, or new evidence that bears on the finding, the finding is checked again. When a finding that a published change rests on no longer holds, or now holds differently, Analyze proposes a revision or retirement of that output (principle 15). The proposal links the change in the evidence that led to it.

## Properties

- Every finding is linked to its evidence, and every change to the findings it rests on (principle 2).
- Each claim's frequency is counted apart from its support (principle 5).
- A finding that a later run identifies again updates the earlier finding, and the new evidence is linked to it.
- Only a finding that holds up against its evidence and is judged worth proposing becomes a proposal. A finding that depends on an open question waits until the question is answered or withdrawn.
- Each change that adds or revises an output proposes the scopes where its knowledge could apply. Each proposed scope carries an origin and the evidence that the knowledge applies there (principles 2 and 9).
- A rejected change is proposed again only on evidence that was not available when it was rejected.
- Model judgment is used only where a script will not do (principle 17).
- A proposal can carry a measurement of its effect (principle 16).
- Analyze never publishes, never changes an output, and never writes a record.
