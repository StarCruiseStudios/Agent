# Archon: Concepts overview

**Layer:** 002, Concepts
**Status:** Proposed

This layer defines the kinds of things that Archon works with, how they relate to one another, and when two instances of one kind count as the same thing. The layer says what each thing is, and it does not describe how things move through the process.

Each concept has its own file in this folder. This file groups the concepts and shows how the groups relate.

---

## Groups

| Group | Concepts | Can Archon change it freely? |
|---|---|---|
| The record | [record](record.md), [session](session.md), [observation](observation.md), [user input](user-input.md), [existing knowledge](existing-knowledge.md), [tag](tag.md), [project](project.md) | A record's fact is fixed. Its metadata, such as tags and verification, can change. |
| Claims | [claim](claim.md), [inference](inference.md), [source](source.md), [evidence](evidence.md), [support](support.md), [frequency](frequency.md) | Yes. These are internal knowledge. |
| Relationships | [association](association.md) | Yes. Associations are kept apart from the records they relate. |
| Analysis | [internal knowledge](internal-knowledge.md), [finding](finding.md), [question](question.md) | Yes. |
| Outputs | [output](output.md), [scope](scope.md), [origin](origin.md), [version](version.md) | No. Archon changes outputs only through approved changes (principle 12). The user can still edit existing knowledge by hand, and the edit is recorded. |
| Change | [change](change.md), [proposal](proposal.md), [measurement](measurement.md) | A change can be drafted freely, and it takes effect only once it is approved. |

## How the groups relate

Records hold what happened and what was found to be true at a given time. Observations in records, together with user input, are the evidence for claims. Associations relate records to one another across the whole set. Findings are inferences about the associated records, and each one is tied to its evidence. Outputs are what agents load, and each output carries scopes with origins. A proposal is a set of changes to outputs, and each change carries the evidence for it.

Internal knowledge is everything Archon derives, and agents never load it directly. Outputs are the only part of Archon's knowledge that agents load, which is why outputs are the only part that needs approval to change.
