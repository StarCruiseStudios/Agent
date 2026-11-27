# Concept: Record

**Layer:** 002, Concepts
**Status:** Proposed

A record is a dated piece of factual information. When layer 001 says "the record," it means all records together. Interpretations of records are [internal knowledge](internal-knowledge.md), so they can change without touching any record.

## Fact and metadata

A record has a fact and metadata. The fact is written once and never changed (principle 3). The metadata can change, and it includes the [tags](tag.md) that the fact itself shows, the record's last-verified date, and whether it is flagged as outdated. Tags that need judgment are internal knowledge, kept apart from the record. [Associations](association.md) between records are kept apart from the records they relate, so they are not part of a record's metadata.

## Dates

A record carries two dates: when it was observed, and when it was last verified. Some records never need verifying. An agent session is a record of what happened, and what happened does not change. Other records describe something that can change, such as what a code base contains, and those records can stop holding. A record that no longer holds is flagged as outdated, and a new record describes what holds now. The outdated record stays in the history.

## Kinds

The set of kinds of record is open. The kinds known so far are the following.

- **Session records** capture agent activity, as described in [session](session.md). They are never verified.
- **Code base records** capture facts about a code base, such as what a file contains or which dependencies it uses. They are verified.
- **User input records** keep notes, answers, and edits from the user exactly as written, as described in [user input](user-input.md).
- **Existing knowledge records** capture what agents load, as described in [existing knowledge](existing-knowledge.md). What agents load can change, so these records are verified.

## Sameness

A record is never replaced in place. Verifying a record again concerns the same record. When it no longer holds, it is flagged as outdated and a new record is added, so the old and new records are two different records.
