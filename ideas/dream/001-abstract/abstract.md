# Archon: Abstract and purpose

**Layer:** 001, Abstract
**Status:** Proposed

This layer says what Archon is, why it exists, and which rules every later layer has to keep. It says nothing about how Archon is built. Each later layer adds detail, and none of them may contradict this one. The layer is split across the following files.

| File | What it covers |
|---|---|
| `abstract.md` | What Archon is and its purpose. |
| `principles.md` | The numbered principles that every later layer cites. |
| `scope.md` | What Archon produces, who it is for, what it learns from, and its non-goals. |
| `scenario-*.md` | Illustrative scenarios that show the principles at work. |

---

## Abstract

Coding agents forget. When a session ends, its lessons end with it, so the next session, or the next agent on another platform, breaks the same interface, hunts for the same build command, and needs the same correction from the user.

Archon keeps that experience and learns from it. It records what agents did: the sessions, tool calls, commands, code changes, test results, user corrections, and outcomes. It also records facts about the code bases that agents work in, and it checks those facts again as the code changes. It links related records to one another, so a fact can be seen with the others it bears on. It then analyzes the linked record across sessions, looking for failures that keep coming back, approaches that keep working, claims that contradict each other, and knowledge that has gone stale. Each finding is checked against its evidence, and a finding that holds up and is worth acting on is turned into a proposed change to what agents know or how they work. A proposal carries its evidence with it, and nothing reaches an agent until the proposal is approved.

## Purpose

Archon exists so that future agents make better decisions because of what past agents went through. That is the only measure of the system. How much knowledge Archon stores has nothing to do with it.
