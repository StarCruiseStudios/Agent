# Archon: Scope and non-goals

**Layer:** 001, Abstract
**Status:** Proposed

This file says what Archon produces, who it is built for, what it learns from, and what it deliberately does not do.

---

## Outputs

Archon produces three kinds of output for agents to use.

| Output | Question it answers | Kind |
|---|---|---|
| **Memory** | What does the agent know? | Descriptive. It covers how a project works and the decisions behind it. |
| **Practices** | How should the agent approach work? | Prescriptive. It covers conventions and ways of working. |
| **Skills** | What reusable capabilities should the agent have? | Procedural. It covers new or modified agent procedures. |

Every output is classified in two independent ways.

**Scope** says where the knowledge applies. Scopes are independent tags with no ordering among them, and one output can carry several. Examples include a single project, a programming language, an engineering domain, and general knowledge that holds for all software work. An engineering domain can be a kind of software, such as embedded systems or web front-ends, or a discipline, such as testing or security. The set of scopes is open.

**Origin** says whether the knowledge is a user preference or generalizable. A user preference records how this user wants work done, and it can hold for one project or for all of the user's work. Generalizable knowledge holds regardless of who is doing the work.

Knowledge is brought into a project only when its scope covers that project.

## Users and setting

Archon is built first for one developer working locally across their own projects and coding agents. Support for teams and organizations is an explicit future goal.

## What Archon learns from

Archon learns from AI coding agents doing software work in projects and repositories. Its evidence is the recorded activity of those agents, the code bases they work in, the knowledge that agents already load, and what the user tells it.

## Non-goals

- Archon does not produce backlog tasks, architecture documentation, or any output beyond memory, practices, and skills.
- Archon never changes what agents load without approval.
- Archon does not treat an agent's assertion as verified knowledge.
- Archon does not turn every repeated observation into an instruction.
- Archon does not treat a question for the user as an output. Questions are part of how Archon reaches a decision, and their answers become evidence.
