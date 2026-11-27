# Scenario: An assumption repeated from one source

**Layer:** 001, Abstract
**Status:** Proposed

This scenario is illustrative. It shows principles 4, 5, and 13 at work.

---

A hand-written instruction file in a project says that the integration tests need a running database. Over the following weeks, five sessions read the file and repeat the claim, and each agent starts a database before running the tests. None of the sessions records whether the tests would have passed without it.

Archon records that the claim appears in five sessions, and it traces all five back to the one instruction file. The claim's frequency is five sessions, and its support is one source (principle 5). The agents' statements are recorded as statements, and what they assert stays a hypothesis until an observation backs it (principle 4). Later, a session runs the integration tests without a database and they pass. Archon proposes a revision to the instruction file, which it treats as existing knowledge (principle 13), and the proposal cites both the original instruction and the passing run.
