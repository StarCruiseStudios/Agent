# Design: Link

**Layer:** 005, Technical design
**Status:** Draft

This file defines how [Link](../003-process/link.md) finds associations between records, the shapes associations take, the content index it searches, how it follows outdated records, and what starts its work. Link reads Collect's namespace and keeps its own data in its own namespace through the [storage interface](storage.md), runs its jobs in the [runtime host](runtime.md), and computes embeddings through the [model gateway](model-access.md).

---

## Linkers

A linker is a deterministic function that reads records and event items and produces the facts of associations. Each linker is registered by name and version, and every association records the linker and version that found it. The set of linkers is open. When a linker is added or changed, Link runs it over every existing record, and only Link's own namespace changes (SEP-1).

## Shapes of association

| Shape | What it is |
|---|---|
| **Direct** | A relation between two records that rests on one fact, such as the parent session identifier in a subagent's record. |
| **Keyed** | One item for a shared value, such as a file path in a repository, with a membership relation to each record that shows the value. Each membership records the event and byte span where the value appears. |

A new record joins an existing keyed association by adding a membership, so no association made earlier is rebuilt when a record arrives (INC-1).

## Linkers known so far

| Linker | Shape | Fact it rests on |
|---|---|---|
| **Subagent of** | Direct | The identifier of the starting session in a subagent's record. |
| **Started from** | Direct | The repository snapshot taken at a session's start. |
| **Same repository** | Keyed by repository | The repository tag of each record. |
| **Same branch** | Keyed by repository and branch | The branch tag of each record. |
| **File touched** | Keyed by repository and path | A tool call that names the path, or a file record of it. |
| **Same command** | Keyed by command text after deterministic normalization | A tool call that runs a command. |
| **Same error line** | Keyed by error text after deterministic normalization, such as removing line numbers and temporary paths | A tool result with a recorded error or a failing exit status. |
| **Same commit** | Keyed by commit hash | A repository snapshot or an event that names the commit. |
| **Loaded knowledge** | Direct | A session event that reads or loads a piece of existing knowledge. |
| **Shared text** | Keyed by the verbatim span | A span that the fuzzy method finds and the verifier confirms. |

Each normalization is a fixed rule, so whether two values match can be checked against the records they come from (LNK-1).

## Fuzzy method

For each new chunk in the content index, Link searches for similar chunks in other records with similarity search and full-text search, each with a threshold set in the configuration. Each pair of records that the search returns goes to a verifier. The verifier records a shared-text association only when it finds a verbatim span that both records contain, longer than a set minimum and not on a configured list of trivial spans. The association rests on that span in each record, so it meets the same check as an association found by exact comparison (LNK-1). A pair that the verifier does not confirm leaves no association.

## Content index

The content index holds the text of session events, existing knowledge, user input, and file records. Text is split into chunks along event boundaries, and an event too long for one chunk is split into several with some overlap. Each chunk records its record, its event, and its byte span in the record file. Each chunk carries an embedding from a local ONNX model (MDA-1), and full-text search covers every chunk. The default model is `jina-embeddings-v2-base-code`, and the configuration can name a different one.

The content index can be dropped and rebuilt from Collect's namespace alone, including with a different embedding model (STO-6).

## Following outdated records

Each kind of association declares whether it depends on its records still holding. A **loaded knowledge** association depends on it, because once the knowledge record is outdated the session did not load the content that holds now. A **file touched** association does not, because the session touched that file whatever the file contains later.

When Collect flags a record as outdated, Link adds a revision to each association of a dependent kind that relates the record, ending the period in which the association held. The earlier revision stays in the history (LNK-3).

## What starts Link's work

Link has one job, started when Collect's namespace has new writes after the position the job last read. The job takes in new records, new event items, and revisions of record metadata. For a session that is still growing, it reads only the new events. For each new item, it runs the linkers, adds chunks to the content index, and runs the fuzzy method for the new chunks.

## What Link exposes

Link exposes everything in its namespace through read handles (LNK-4).

- Record nodes, carrying the fields of Collect's record items and no record content.
- Direct associations, keyed associations, and their memberships, each with the linker and version that found it.
- Every revision of every association.
- Search over the content index.

---

## Technical requirements

**LKD-1. Every association names the fact it rests on.** This serves LNK-1.

- Every direct association names the fact in each record that states the relationship.
- Every membership of a keyed association names the event and byte span where its value appears.
- Every shared-text association names a verbatim span that both records contain.

**LKD-2. Similarity alone never makes an association.** This serves LNK-1 and MOD-3.

- A pair of records that similarity search returns and the verifier does not confirm has no association.

**LKD-3. A new record adds to keyed associations and rebuilds none.** This serves INC-1.

- A record that shows a value already keyed adds one membership and changes no earlier membership.
- A growing session is read only from the events it added since the job last read it.

**LKD-4. Every association records how it was found.** This serves LNK-4 and MOD-2.

- Every association names the linker and version that found it.
- Associations found by the fuzzy method are exposed in the same way as every other association.

**LKD-5. Outdated records end the associations that depend on them.** This serves LNK-3.

- After a record is flagged as outdated, every association of a dependent kind that relates it has a revision that ends its period.
- No association of a kind that does not depend on its records holding is revised because a record was flagged as outdated.
