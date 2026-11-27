# Requirements: Outputs

**Layer:** 004, Requirements
**Status:** Draft

These requirements apply to [outputs](../002-concepts/output.md), the memory, practices, and skills that agents load, including the [existing knowledge](../002-concepts/existing-knowledge.md) that agents already load.

---

**OUT-1. Every output is a memory, a practice, or a skill.** This follows from the outputs and the non-goals in layer 001.

- Every change that adds an output names it as a memory, a practice, or a skill.
- No change proposes an output of any other kind, such as a backlog task or architecture documentation.
- No question is offered to agents as an output.

**OUT-2. Descriptive and prescriptive knowledge are kept apart.** This follows from principle 8.

- Every memory that Archon adds describes how a project works and the decisions behind it, and prescribes nothing.
- Every practice or skill that Archon adds prescribes how agents work.
- A finding that both describes how a project works and prescribes how agents work on it is proposed as separate changes to a memory and to a practice or skill.

**OUT-3. Existing knowledge is treated as published outputs.** This follows from principle 13 and from the definition of existing knowledge in layer 002.

- Every piece of existing knowledge that Collect records is an output with a current version, whether or not Archon published it.
- A change can revise or retire a piece of existing knowledge, and that change meets every requirement that applies to any other change.
- Every piece of existing knowledge has an author of the user, an agent, or unknown, held as an inference with its evidence (ANL-3).
- Existing knowledge is never user input, whoever wrote it, so on its own it never makes a finding hold up. A claim it states holds up only on other evidence, such as records of the code base it describes.
