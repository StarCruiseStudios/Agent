# Scenario: Knowledge that has gone stale

**Layer:** 001, Abstract
**Status:** Proposed

This scenario is illustrative. It shows principles 3, 10, 14, and 15 at work.

---

A published memory says that a project builds with one command, and agents have used it successfully for months. The project then moves to a different build tool. In the next session, the agent runs the old command, it fails, and the agent finds the new one.

Because the session read the build files, Archon checks its records of them again. The record that described the old build setup no longer holds, so it is marked as outdated and a new record is added, and the old record stays exactly as it was captured (principle 3). The published memory rests on the outdated record, so the memory is checked again against the new record (principle 15), and Archon proposes a revision. When the revision is approved and published, the earlier version stays in the history (principle 10), and it can be restored if the project returns to the old build tool (principle 14).
