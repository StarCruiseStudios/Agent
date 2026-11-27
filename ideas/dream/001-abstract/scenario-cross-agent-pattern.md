# Scenario: One cause across three agents

**Layer:** 001, Abstract
**Status:** Proposed

This scenario is illustrative. It shows principles 1, 2, 12, and 18 at work.

---

In one session, Claude changes an API without checking its consumers, and the tests fail. In another, Codex changes an interface and misses the components that depend on it. In a third, a Cursor agent is corrected by the user for changing a public API without checking compatibility. Each transcript describes the problem in different words, and none of the sessions refers to the others.

Archon finds one cause behind all three and proposes a practice: before changing a public interface, find its consumers and check compatibility. The failing tests and the user's correction carry more weight than what the agents said about their own work (principle 1). The proposal links to all three sessions (principle 2). It is reviewed against that evidence and either approved, so agents follow it, or rejected, so the reasons are recorded (principle 12). Once it is approved, the practice is available to Claude, Codex, and Cursor alike (principle 18).
