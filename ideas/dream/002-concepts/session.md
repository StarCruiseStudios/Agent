# Concept: Session

**Layer:** 002, Concepts
**Status:** Proposed

A session is one agent's conversation on one platform. A subagent's run is a session of its own, associated with the session that started it. A session carries one or more [project](project.md) tags. A session is recorded as a session [record](record.md).

## Session part

A session is made of one or more parts. Resuming, compacting, or forking a conversation starts a new part of the same session. Each part keeps its own span of time, because when something was said or done can change what it means.

## Event

An event is one recorded item within a session part, such as a message, a tool call and its result, a command and its output, a code change, a test result, a user correction, or an outcome. Events keep the order in which they happened.

## Sameness

Two sessions are the same when the platform identifies them as the same conversation. Resumed, compacted, and forked conversations are parts of one session.
