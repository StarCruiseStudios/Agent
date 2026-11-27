# Concept: Tag

**Layer:** 002, Concepts
**Status:** Proposed

A tag is a label that marks what something relates to, such as a [project](project.md), a language like C#, an engineering domain like user interface work, or coding in general. Records and outputs use one shared, open set of tags, with no ordering among them.

On a [record](record.md), tags say what the record is relevant to. A tag that the record's fact itself shows, such as the repository a session ran in, is part of the record's metadata. A tag that needs judgment, such as the engineering domain that a session's work belongs to, is an [inference](inference.md). It is kept in [internal knowledge](internal-knowledge.md) apart from the record, and it can be revised.

On an [output](output.md), tags are its [scopes](scope.md).

## Sameness

Two tags are the same when they name the same thing. Whether two differently worded tags name the same thing is a judgment, and it can be revised.
