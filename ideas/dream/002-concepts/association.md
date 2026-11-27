# Concept: Association

**Layer:** 002, Concepts
**Status:** Proposed

An association is a factual relationship between two or more [records](record.md), derived directly from what the records contain. Examples include a code base fact and the sessions that changed the same file, a subagent's session and the session that started it, and two sessions that ran in the same repository. An association states only what follows from the facts themselves, so it is checkable against the records it relates and goes no further than they do.

An association differs from an [inference](inference.md). An inference goes beyond what was observed, such as judging that three differently worded sessions describe one problem. An association stays within what was observed, such as noting that the three sessions changed the same interface. Connections that require judgment are [findings](finding.md), and associations are part of the evidence they rest on.

An association refers to the records it relates and is kept apart from them, so creating, revising, or discarding an association never changes a record.

## Sameness

Two associations are the same when they relate the same records in the same way.
