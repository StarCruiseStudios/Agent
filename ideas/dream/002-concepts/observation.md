# Concept: Observation

**Layer:** 002, Concepts
**Status:** Proposed

An observation is a fact present in a [record](record.md), dated by when it was observed. A command returning exit code 1 is an observation, and so is a file's contents at a given commit.

Something being said is also an observation. When an agent writes "the tests pass," the observation is that the agent made the statement. What the statement asserts is a [claim](claim.md), and it needs its own [evidence](evidence.md), such as the recorded test output. This keeps what was observed apart from what was asserted (principle 4).

## Sameness

Two observations are the same when they point at the same fact in the same record.
