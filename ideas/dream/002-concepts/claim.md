# Concept: Claim

**Layer:** 002, Concepts
**Status:** Proposed

A claim is a statement that evidence can support or contradict, such as "changing a public interface without checking its consumers breaks dependent code." Claims come from the content of observed statements, from [inferences](inference.md), from [existing knowledge](existing-knowledge.md), and from [user input](user-input.md).

## Dates

Every claim carries two dates: when it was recorded, and the period in which it held. The second date lets Archon tell knowledge that has gone stale, which held for a time and then stopped, from knowledge that never held.

## Properties

A claim has a [source](source.md) for each occurrence, [evidence](evidence.md) for and against it, [support](support.md), and [frequency](frequency.md). Support and frequency are separate properties (principle 5).

## Sameness

Two claims are the same when Archon judges that they state the same thing. The judgment is an inference, so it carries its own evidence and can be revised without touching the record.
