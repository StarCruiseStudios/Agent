# Design: User surface

**Layer:** 005, Technical design
**Status:** Draft

This file defines where the user reviews and decides on changes, answers questions, gives notes, rolls back outputs, and starts measurements. The user surface reads the namespaces of Approve, Analyze, Measurement, Link, and Collect through read handles, and it sends everything the user states to the service, where Collect records it as user input (COL-7). It writes to no namespace itself.

---

## Desktop app

The user surface is a desktop app built with Tauri. Its back end is Rust and uses the same storage interface as the rest of Archon, and its front end is a web view written in TypeScript. It runs on Windows, Linux, and macOS.

- The app reads every namespace it shows through read handles (RUN-1).
- The app sends user input to the service over a local IPC channel of its own, a named pipe on Windows and a Unix domain socket on Linux and macOS, which only the user's account can open (RUN-4).
- The app can start and stop the service. It sits in the system tray, and it shows the number of pending changes and open questions there.
- Desktop notifications of new proposals and new questions can be turned on in the app's settings.

## Where user input comes from

Decisions on changes, edits made while deciding, rollbacks, answers to questions, and notes are given only in the desktop app. The service accepts user input only on the app's channel. No command line command and no MCP tool sends user input, so an agent working in a session has no command that decides, rolls back, answers, or gives a note on the user's behalf (principle 12, APR-1).

The `archon` command line keeps the commands that change no decision: starting and stopping the service, `archon status`, `archon hooks install`, `archon analyze`, `archon measure`, and `archon models uses`.

## Review

The review view offers each pending change for a decision with the following, as APR-3 requires.

- **Content.** The change's content, and for a revision a diff against its base.
- **Findings.** The findings the change rests on, with the support of each claim in independent sources shown apart from its frequency in occurrences, sessions, and projects (ANL-1).
- **Evidence.** Each piece of cited evidence as an excerpt of its record, which opens to the full record. Evidence that is user input is marked as user input (TRC-2).
- **Scopes.** Each proposed scope with its origin and the evidence that the knowledge applies there.
- **Measurement.** Every measurement of the change, as a table of metrics for each arm (MSD-4).
- **History.** Earlier changes judged the same as this one, such as a rejection with its reasons.

## Deciding

A change is approved, rejected with reasons, deferred, or brought back to review from deferred (APR-2). While deciding, the user can edit the content in the app's editor, and add or remove scopes or change the origin of a scope. The decision, its reasons, and its edits are sent as one piece of user input. The app then shows whether Approve applied the decision or recorded it as not applied, with the reason, such as a base that has changed (APD-3).

## Questions

The questions view lists open questions in order of the number of findings that wait on each one, with the most first (QST-4). Each question shows the evidence that raised it (QST-1). An answer is free text, sent as user input linked to the question.

## Notes

A note is free text, kept exactly as the user writes it (COL-4). The user can add tags to a note, such as a project or all of the user's work, and the tags are part of the user input.

## Rollback

The outputs view lists every output with its versions. Rolling back an output shows its current version, the version that would become current, and the change whose approval would be taken back, and it asks for confirmation and a reason (REV-1). The rollback is sent as user input (REV-3).

## Measurement

The user can start a replay of one or more pending changes from the review view, within the limits set for replays. Each measurement in progress is shown with its runs.

---

## Technical requirements

**USD-1. Every change is offered with what it needs to be decided.** This serves APR-3.

- Every pending change is shown with its content, its findings, its cited evidence, the support and frequency of each claim, its proposed scopes with origins and evidence, and every measurement of it.

**USD-2. User input comes only from the desktop app.** This serves APR-1 and REV-3.

- The service accepts decisions, edits, rollbacks, answers, and notes only on the desktop app's channel.
- No command line command and no MCP tool sends user input.

**USD-3. The user surface writes no namespace.** This serves SEP-2 and COL-7.

- Everything the user states reaches Archon as user input that Collect records.
- The desktop app opens only read handles.

**USD-4. Open questions are shown in ranked order.** This serves QST-4.

- The questions view lists open questions by the number of findings that wait on each one, with the most first.
