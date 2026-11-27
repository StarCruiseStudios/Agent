# Requirements: Collect

**Layer:** 004, Requirements
**Status:** Draft

These requirements apply to [Collect](../003-process/collect.md), the step that records facts and keeps record metadata current.

---

**COL-1. Collecting the same fact again adds no second record.** Layer 003 sets this as a property of Collect.

- Collecting a finished session a second time leaves the set of records unchanged.
- Collecting a session that has grown since it was last collected adds records only for the new events.
- Collecting existing knowledge or a code base fact that has not changed adds no record (COL-5).

**COL-2. A record's fact never changes after it is written.** This follows from principle 3.

- The fact of every record is identical to how it was captured, at any later time.
- Flagging a record as outdated and updating its last-verified date change only its metadata.

**COL-3. Every session on a supported platform is recorded in full, and none is lost.** This follows from principles 1 and 18.

- For every session that a supported platform keeps, the record holds every event that the platform kept, in the order the events happened.
- A session that is still running is recorded as it grows, and the events already recorded stay as they were (layer 003, Collect).
- Each part of a session is recorded with its own span of time (layer 002, session).

**COL-4. User input is kept exactly as written.** This follows from principle 6.

- A note, an answer, or an edit made while deciding on a change is stored with the same text the user gave.
- The same words given twice are recorded as two pieces of user input (layer 002, user input).

**COL-5. A record of something that can change can be checked again on request.** Layer 003 defines this check.

- A check that confirms the record updates its last-verified date and nothing else.
- A check that finds the record no longer holds flags it as outdated and adds a new record of what holds now.
- The result of a check is the same whichever step asked for it.

**COL-6. Collect writes only what the fact itself shows.** Layer 003 states that Collect never interprets a fact.

- Every tag in a record's metadata is shown by the fact itself, such as the repository a session ran in.
- Collect stores no claim, support, frequency, tag that needs judgment, or judgment of who wrote a piece of existing knowledge.
- When an agent states something, the record holds that the statement was made, and what the statement asserts is left to Analyze as a claim (principle 4).

**COL-7. Publications, decisions, and hand edits are recorded as facts.** Layer 003 requires that the steps above Collect learn about publications and decisions only from Collect, and layer 002 requires that a hand edit to existing knowledge is recorded.

- After every publication, the content that agents now load is recorded as existing knowledge, from where agents load it.
- Every decision on a change, including taking back an approval, is recorded as user input as the user gave it, with its reasons and any edits made while deciding.
- When the user edits existing knowledge by hand, a check of that knowledge records the edited content and flags the earlier record as outdated (COL-5).

**COL-8. Every record carries its dates.** Layer 002 gives every record the date it was observed and the date it was last verified.

- Every record carries the date its fact was observed.
- Every record of something that can change carries its last-verified date.
- Session records carry no last-verified date, because what happened in a session does not change.
