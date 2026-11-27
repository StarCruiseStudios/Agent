# Requirements: Agent platforms

**Layer:** 004, Requirements
**Status:** Draft

These requirements name the agent platforms that Archon works with, as principle 18 requires.

---

**PLT-1. Archon learns from Claude Code, Codex, and Cursor, including their subagents.** This follows from principle 18, and these are the three platforms that layer 001 shows in its scenario about one cause across three agents.

- Sessions from each of the three platforms are recorded (COL-3).
- A subagent's run on any of the three platforms is recorded as a session of its own and associated with the session that started it (layer 002, session).

**PLT-2. The set of platforms is open.** This follows from principle 18 and from layer 003, where the set of places that facts come from is open.

- Adding a platform to learn from requires no change to Link, Analyze, or Approve.
- Facts from a newly added platform are recorded and exposed by Collect the same way as facts from the platforms already supported.

**PLT-3. Every supported agent can use every published output.** This follows from principle 18.

- For the same project, direct access offers agents on every supported platform the same current versions.
- Every published output can reach an agent on each supported platform through direct access.
