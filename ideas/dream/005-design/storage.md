# Design: Storage

**Layer:** 005, Technical design
**Status:** Draft

This file defines the storage interface that every step uses, the namespace that each step keeps and the kinds of information it holds, and the engines that keep the data behind the interface. It covers the data of [Collect](../003-process/collect.md), [Link](../003-process/link.md), [Analyze](../003-process/analyze.md), and [Approve](../003-process/approve.md), and the namespaces of Exposure, Measurement, and the runtime host.

---

## Storage interface

The storage interface is a Rust library that every component links. Every component reads and writes its data only through the interface, and no component names an engine or reaches one directly. The engines behind the interface can therefore be changed without any change to the steps that use it (SEP-1).

The interface offers only general kinds of storage and query. It holds no notion of a record, an association, a finding, or any other concept from layer 002. Each step builds its own concepts from the capabilities below.

### Namespaces and access

Each step owns one namespace. A component opens a namespace through the interface and receives one of two kinds of handle.

- A **write handle** is given only for the namespace of the component's own step.
- A **read handle** is given for the namespace of any step beneath it.

No handle of either kind is given for the namespace of a step above it. The interface enforces both rules, so no step writes another step's data (SEP-2) and no step reads what a step above it holds (SEP-4).

[Exposure](exposure.md) owns one namespace, which records what its job wrote, where, and from which version. Exposure reads the namespaces of Approve, Analyze, and Collect.

[Measurement](measurement.md) owns one namespace, which holds measurements, runs, and metric values. Measurement reads the namespaces of Approve, Analyze, Link, and Collect.

The [runtime host](runtime.md) also owns one namespace, which holds its request queue and belongs to no step. Components add requests through the runtime host and never through a handle of their own.

### Capabilities

| Capability | What it provides |
|---|---|
| **Files** | Content that is written once or grows only by appending to its end. A file that has stopped growing is sealed with a content hash. A sealed file can be archived and compressed, and reading it returns the same bytes as before. |
| **Items** | Typed entries with fields and an ID that is never reused. An item kind can declare an identity key, and inserting an item whose identity key is already present returns the existing item and adds nothing. |
| **Relations** | Typed links between two or more items, with fields of their own. A relation can refer to items in a namespace beneath its own. |
| **History** | Every write is an insert. A revision of an item or relation is a new row with the time it was recorded, and the row it replaces stays. A read returns the current state, or the state as of an earlier recorded time. An item can carry the period in which it held, kept apart from the time it was recorded. |
| **Search** | Similarity search over embeddings, where each embedding is labeled with the model that produced it. Full-text search over item fields and file content. A search can combine the two, and can be narrowed by item fields or by relations. |
| **Traversal and counts** | Following relations across any number of hops, through every namespace the handle can read. Counting and grouping over items and relations. |
| **Changes since a position** | Every write to a namespace has a position in one increasing sequence for that namespace. A reader asks for every write after a position it holds. |
| **Atomic writes** | A group of writes to one namespace becomes visible all at once or not at all. |
| **Rebuild** | Dropping a namespace's contents, and rebuilding its search indexes with a different embedding model. |

### Operations

A step describes a read as a composition of operations, such as finding items by field or identity key, following relations, ranking by similarity or text match, filtering, and counting. The interface carries out the composition on whichever engines hold the data, including a composition that spans namespaces kept in different engines. No step writes a query in the language of an engine.

## Namespaces

### Collect

Collect's namespace holds one file for each record's fact, one item for each record, and one item for each event in a session.

**Record files.** Facts arrive in whatever form their source gives them, and Collect writes each one to its own file in the form it was captured. A record file is written once, and its bytes never change (COL-2). A session record that is still running grows by appending its new events, and the bytes already written stay as they were (COL-3). A record file is sealed once the record stops growing.

**Record items.** Each record item holds the following kinds of information.

- The record's ID and kind, such as session, code base, existing knowledge, or user input (layer 002, record).
- The file that holds its fact.
- The identity of the fact as its source defines it, such as a platform's session identifier or a file's path and commit, declared as the item's identity key so that collecting the same fact again finds the existing record (COL-1).
- The date the fact was observed and, for a record of something that can change, the date it was last verified (COL-8).
- The tags that the fact itself shows, such as the repository a session ran in (COL-6).
- Whether the record is flagged as outdated, related to the record added when it was flagged.
- For a session record, its parts with the span of time of each one (layer 002, session).

**Event items.** Each event in a session has an item of its own, holding its session part, its position, its time, the byte span of the record file it occupies, and a common kind, as [Collect](collect.md) defines them.

### Link

Link's namespace holds the following kinds of information.

- **Record nodes.** One item for each record that Link relates, carrying the record's ID and the fields of the record item that Link reads. A record node never contains record content.
- **Associations.** Each association names the kind of relationship, the records it relates, the facts in those records that state the relationship (LNK-1), and the method that found it. An association between two records is a relation. An association among more than two records is an item of its own, with a relation to each record it relates.
- **Content index.** Record content split into chunks, where each chunk refers to its record and to the exact span of the record file it came from. Each chunk carries an embedding and is covered by full-text search.

The content index is what Link searches when it uses a fuzzy method to find associations (MOD-1). Every revision of an association is kept (LNK-3).

### Analyze

Analyze's namespace holds the following kinds of information.

- **Claims**, each with the date it was recorded and the period in which it held (ANL-10), and each occurrence of a claim with its source (layer 002, source).
- **Inferences and judgments**, each with its evidence or reasons (ANL-3). These include relationships between records that need judgment, tags that need judgment, who wrote each piece of existing knowledge, whether two claims, findings, changes, or tags are the same, and whether an opportunity is promising or a finding is worth proposing.
- **Support and frequency** for each claim, counted separately (ANL-1).
- **Opportunities**, each with its score, the value of each factor, and its promising judgment (MOD-4).
- **Findings** and **questions**, each with every lifecycle state it has passed through.
- **Proposals and changes**, each change with its kind, its content, its proposed scopes with their origins and evidence (ANL-5), and the findings it rests on.
- **Dependencies.** For every item, the records, associations, and other items it rests on, so new input reaches only the work it affects (INC-3, ANL-8).
- **Claim embeddings**, used to search for claims that may be the same.

Analyze's items refer to records and associations in the namespaces beneath it by their IDs.

### Approve

Approve's namespace holds the following kinds of information.

- **Decisions.** Each decision refers to one change in Analyze's namespace and records the decision, its reasons, and any edits made while deciding (APR-2, APR-5).
- **Outputs and versions.** Each output has its kind, and each version holds its content, its applied scopes, and the origin of each scope (APR-4).
- **Current versions.** Which version of each output is current, if any (APR-6).
- **Change states.** Every lifecycle state each change has passed through (APR-7).

### Copies and rebuilding

A namespace may hold a copy of fields it reads from a namespace beneath it, such as the record fields on Link's record nodes, and every such copy can be rebuilt from the namespace it came from. Link's namespace can be dropped and rebuilt from Collect's alone, and Analyze's from Link's and Collect's alone (SEP-1).

## Engines behind the interface

| Engine | What it keeps | Capabilities it carries |
|---|---|---|
| **Files on disk** | Collect's record files, and the archive files that sealed records are moved into. | Files |
| **SQLite** | The items of the namespaces of Collect, Approve, Exposure, Measurement, and the runtime host, and the sequence of every namespace. | Items, relations, history, changes since a position, and atomic writes within one database |
| **Lance** | The items and relations of Link's and Analyze's namespaces as Lance tables, with their embeddings, used through the LanceDB library. | Items, relations, history, and search |
| **lance-graph** | No data of its own. It reads Lance tables as graph nodes and relationships, with Cypher and with SQL through DataFusion. | Traversal and counts over Link's and Analyze's namespaces |

The interface combines results when one composition spans engines, such as following relations from Analyze's items to Collect's record items.

### Data directory

All data lives under one Archon data directory on the user's machine (DAT-1), with one subdirectory for each namespace. The data is not encrypted by Archon. Data at rest is protected by the disk encryption of the user's operating system.

### Files

Record files are written uncompressed and named by the ID of the item that refers to them. Archiving moves sealed files into compressed archive files and records the new location inside the interface. The location is bookkeeping kept by the interface, and it is not part of any item, so a step that reads a file sees no difference. An original file is removed only after its archived copy matches the sealed content hash.

### Atomic writes and positions in Lance

A namespace kept in Lance spans several tables, and Lance commits each table on its own. The interface gives each write its position in the namespace's sequence, held in SQLite, and commits that position only after every table in the group has taken its writes. A read through the interface sees only writes at or before the last committed position, so a group of writes becomes visible all at once.

### History in Lance

The version history that Lance keeps for its own tables is not used as Archon's history. Every revision is a row, so compaction and version cleanup can run on Lance tables without losing a revision.

---

## Technical requirements

**STO-1. A file's bytes never change after they are written.** This serves COL-2 and COL-3.

- The bytes of every sealed file match its content hash at any later time, whether the file is archived or not.
- A file that is not sealed changes only by adding bytes to its end.

**STO-2. Archiving changes nothing that a step reads.** This serves COL-2 and SEP-3.

- Reading an archived file through the interface returns the same bytes as before it was archived.
- Archiving changes no item and no relation.
- No original file is removed until its archived copy matches the sealed content hash.

**STO-3. Inserting an item whose identity key is present adds nothing.** This serves COL-1.

- Inserting an item with an identity key already present in its namespace returns the existing item and leaves the namespace unchanged.
- Collecting a session that has grown adds only the new events to its record file.

**STO-4. Each step writes only its own namespace and reads only those beneath it.** This serves SEP-2 and SEP-4.

- The interface gives a write handle only for the namespace of the caller's own step.
- The interface gives no handle for the namespace of a step above the caller.

**STO-5. Every revision is kept as a new row.** This serves TRC-3.

- No row in any namespace is updated in place or deleted.
- A read as of any earlier recorded time returns the state that held at that time.
- After compaction and version cleanup of any Lance table, every revision can still be read.

**STO-6. Each namespace above Collect can be rebuilt from the namespaces beneath it.** This serves SEP-1.

- Dropping Link's namespace and rebuilding it from Collect's yields the same associations and the same indexed spans.
- Rebuilding Analyze's namespace reads only Link's and Collect's namespaces.
- Every embedding names the model that produced it.

**STO-7. A reader takes in only what is new.** This serves INC-1.

- Every write to a namespace has a position in one increasing sequence for that namespace.
- Reading a namespace from a position returns every write after that position and no write at or before it.

**STO-8. All data is on the user's machine.** This serves DAT-1.

- Every namespace lives under the Archon data directory on the user's machine.
- Every namespace can be read and written with no network connection.

**STO-9. No step depends on an engine.** This serves SEP-1.

- No component outside the storage interface names or opens an engine.
- Moving a namespace to a different engine requires no change to any step.

**STO-10. A group of writes to one namespace is atomic.** This serves APR-6 and COL-7.

- A read never sees some writes of a group without the rest.
- A group that fails leaves the namespace as it was before the group began.
