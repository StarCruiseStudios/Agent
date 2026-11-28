# Design: Collect

**Layer:** 005, Technical design
**Status:** Draft

This file defines how [Collect](../003-process/collect.md) records facts from each place they come from, the event view it exposes for sessions, what starts its work, and how it checks records again. Collect keeps its data in its own namespace through the [storage interface](storage.md), runs its jobs in the [runtime host](runtime.md), and makes no model calls (MDA-1).

---

## Parts of Collect

| Part | What it records |
|---|---|
| **Platform adapters** | Agent sessions from each supported platform, including subagents. |
| **Event view** | One item for each event in a session, in a form that is the same for every platform. |
| **Code base capture** | Repository snapshots and file records. |
| **Existing-knowledge capture** | What agents load, from each place they load it. |
| **User-input intake** | Notes, answers, decisions, and edits from the user. |
| **Checks** | Whether a record of something that can change still holds. |

## Platform adapters

Each supported platform has one adapter, and the set of adapters is open (PLT-2). An adapter reads the platform's own session store, such as the JSONL transcript files of Claude Code and Codex and the local SQLite chat data of Cursor.

- **One record for each session.** A session is one record with one record file. The adapter appends the session's new content to the end of the file in the form it was captured, as bytes from a transcript file or as row values from a database, and it never rewrites earlier content (COL-2, COL-3).
- **Sessions and parts.** The adapter maps the platform's identifiers to sessions and session parts, so a resumed, compacted, or forked conversation becomes a new part of the same session with its own span of time (layer 002, session).
- **Subagents.** A subagent's run is recorded as a session of its own. The identifier of the session that started it is recorded as metadata that the fact shows. The association between the two sessions belongs to Link.
- **Tags.** The adapter writes only the tags that the fact shows, such as the platform, the model, the working directory, the repository, and the branch (COL-6).
- **Changed history.** When a platform's stored session changes other than by appending, the adapter keeps what is already recorded and appends the changed content as new content of the session. Nothing already recorded is rewritten (COL-2).

## Event view

Collect keeps one item for each event in a session, so the steps above it read events in one form whatever platform they came from (PLT-2). Each event item holds its session part, its position, its time, the byte span of the record file it occupies, and a common kind.

| Common kind | What it covers |
|---|---|
| **User message** | A message the platform labels as from the user. |
| **Agent message** | A message the platform labels as from the agent. |
| **Tool call** | A call to a tool, with the tool's name and input as the platform records them. |
| **Tool result** | The result of a tool call, with any exit status or error the platform records. |
| **Other** | Any other entry, with the platform's own label. |

The adapter assigns the common kind from the platform's own label, and it keeps every field the platform records explicitly. Deciding that an event is a test run, a correction, a decision, or an outcome needs interpretation, so Collect never does it (COL-6).

For every session, the event item of the first user message identifies the request that started the session, and an outcome that the platform records is kept as an event (MEA-1).

## What starts Collect's work

| Source | What it starts |
|---|---|
| **File watcher** | The watcher, built on the `notify` crate, reports changes in each platform's session store, and the adapter records them as the session runs. |
| **Scheduled scan** | Each adapter scans its platform's session store on a schedule and records whatever the watcher missed. The same scan runs every time the service starts (RUN-2). |
| **Platform hooks** | Hook commands notify the service when a session starts, when it ends, and at other points the platform offers. When a session starts and when it ends, the hook command also takes a repository snapshot. |

Every source feeds the same adapter code, so a session is recorded the same way whichever source reported it, and a session reported twice is recorded once (COL-1).

Archon's hooks are required on every supported platform, because the hook command is what takes a session's start snapshot whether or not the service is running (MEA-1). The `archon hooks install` command adds Archon's hook commands to the settings of each supported platform. Every time the service starts, it installs the hooks on any supported platform that lacks them and reports each platform it installed them on, and `archon status` shows whether each platform's hooks are installed.

## Code base capture

Collect keeps two kinds of code base record, and it reads repositories through the `gix` crate.

- **Repository snapshots.** When a session starts and when it ends, Collect records the repository's identity, the commit, the branch, and a diff of the changes that are not committed. A snapshot records one moment, so it is never checked again. The snapshot taken at a session's start is how the code base state that the session started from is recovered (MEA-1).

  The hook command takes the snapshot itself, so a snapshot is taken whether or not the service is running. It writes the snapshot, with the platform's session identifier, as a file in a snapshot spool in the Archon data directory. The spool belongs to no namespace. Collect records each spooled snapshot as a code base record, and it removes the spool file once the record is written. For a session that ran before the hooks were installed, Collect takes a snapshot when the watcher or a scan first reports the session.
- **File records.** A file record holds one file's content at a path in a repository. Collect records the files that a session's tool calls show it read or changed, and the files that match patterns set in the configuration, such as manifests, build files, and continuous integration settings. A file record describes something that can change, so it is checked again.

## Existing-knowledge capture

The configuration names each place that agents load knowledge from, and the set of places is open. The places known so far are instruction files such as `CLAUDE.md`, `AGENTS.md`, and Cursor rules, the platforms' built-in memory directories, skill directories, and the managed files and the published-outputs directory that [Exposure](exposure.md) writes. Each piece of existing knowledge is recorded where it was found, and its record is checked again.

Collect checks each place on a schedule, when a session starts, and on request. A hand edit to existing knowledge is found by the next check, which adds a record of the edited content and flags the earlier record as outdated (COL-7).

## User-input intake

Notes, answers to questions, decisions on changes, edits made while deciding, and rollbacks reach the service over local IPC from the desktop app (USD-2). Each one is written as a new record whose file holds exactly what the user gave (COL-4). Each submission is its own record, so the same words given twice are two records.

## Checks

A check reads a record's source again and compares its content with the record's content hash. A check that matches updates the record's last-verified date. A check that differs flags the record as outdated and adds a new record of what holds now (COL-5).

Checks run when a request arrives on the request queue, and on a schedule for every record of something that can change. A check reads only the source and the record, so its result is the same whatever started it.

---

## Technical requirements

**CLD-1. Every session is one record whose file only grows.** This serves COL-1, COL-2, and COL-3.

- Every session has exactly one record and one record file.
- Recording more of a session only appends to its record file.
- Content that a platform changes in its stored session is appended, and the content recorded before it stays as it was.

**CLD-2. The event view is the same for every platform.** This serves PLT-2.

- Every event item has a session part, a position, a time, a byte span, and a common kind.
- Adding a platform adds an adapter and changes no event kind and no step above Collect.

**CLD-3. Collect assigns no kind that needs interpretation.** This serves COL-6.

- Every common kind of an event follows from the platform's own label.
- No event item marks an event as a test run, a correction, a decision, or an outcome unless the platform's own label says so.

**CLD-4. A session reported by more than one source is recorded once.** This serves COL-1.

- A session that the watcher, a scan, and a hook all report has one record, and each event in it has one event item.

**CLD-5. The start state of every session in a recorded repository can be recovered.** This serves MEA-1.

- Whenever the service runs, every supported platform has Archon's hooks installed.
- Every session started after the hooks were installed has a repository snapshot taken at its start, whether or not the service was running.
- Every session's first user message is identified by an event item.

**CLD-6. A hand edit to existing knowledge becomes a new record.** This serves COL-7.

- After a check of an edited piece of existing knowledge, a record holds the edited content and the earlier record is flagged as outdated.
