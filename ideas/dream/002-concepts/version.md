# Concept: Version

**Layer:** 002, Concepts
**Status:** Proposed

A version is the state of one [output](output.md) as of one publication: its content, its applied [scopes](scope.md), and their [origins](origin.md). An output has at most one current version. Earlier versions are kept, so each output can be returned to an earlier version on its own (principle 14). A version that a later one has replaced is **superseded**, and it stays in the history (principle 10).

## Sameness

Two versions are the same when they belong to the same output and come from the same publication.
