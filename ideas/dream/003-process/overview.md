# Archon: Process overview

**Layer:** 003, Process
**Status:** Proposed

This layer describes how the concepts in layer 002 relate to one another as Archon works. It defines the four steps that Archon works in, the knowledge that each step captures, the lifecycles that findings, changes, and questions move through, and the properties that hold across the whole process. It stays at the level of what happens and what must remain true.

Each step has its own file in this folder, and so does each topic that spans more than one step.

| File | What it covers |
|---|---|
| `overview.md` | How the steps relate, what each one captures, and the properties that hold across all of them. |
| `collect.md`, `link.md`, `analyze.md`, `approve.md` | One file for each step. |
| `finding-lifecycle.md` | The states a finding moves through. |
| `change-lifecycle.md` | The states a change moves through, and how versions are superseded. |
| `questions.md` | How a question is formed, answered, or withdrawn. |
| `exposure.md` | How approved outputs reach agents, through direct access and through publication into a project's own files. |
| `rollback.md` | How a published change is undone. |

---

## Steps

Archon works in four steps.

1. **Collect.** Facts are recorded as they were observed, in whatever form they take, such as what happened in an agent session, what a code base contains, what agents load, or what the user says.
2. **Link.** Factual associations between records are derived from the records themselves, such as two sessions that changed the same file.
3. **Analyze.** Records and their associations are searched across sessions and projects for the more abstract connections that require judgment, such as patterns, contradictions, and outdated knowledge. Each finding that holds up against its evidence and is worth proposing becomes a proposed change to memory, practices, or skills, and revisions or retirements of published outputs are proposed when what they rest on changes.
4. **Approve.** A proposed change is published to agents only after it is approved.

The steps are numbered in the order that knowledge moves through them.

Approved outputs reach agents through [exposure](exposure.md), which is not a step. The steps run when events start them, while exposure is a live surface that agents use as they work. Agents can work with approved outputs in Archon directly, and an approved output can be published into a project's own files so that the project uses it without Archon. Exposure builds on Approve and never alters it.

## How the steps relate

The four steps are the parts that principle 19 describes. Each step builds only on the steps beneath it: Link builds on Collect, Analyze builds on Link and Collect, and Approve builds on Analyze. A step reads what the steps beneath it expose and never alters it, and it keeps what it captures as its own knowledge. A step beneath another never depends on the step above it, so Collect works the same way whether Link exists or not, and Link can be rebuilt without any change to Collect.

What a step exposes is everything it holds that may be relevant above it, described by what it is. Collect exposes records as facts, without shaping them for how Link relates them. Link exposes associations as relationships between records, without shaping them for what Analyze will look for.

What a higher step produces reaches the lower steps only as new facts. A publication changes what agents load, and a decision on a change is user input, so Collect records both. Analyze learns that an output changed, or that a change was rejected, from those records. This keeps every dependency pointing downward, and it is how published changes stay current: when the facts or associations beneath a published change move, Analyze sees it and proposes a revision or retirement (principle 15).

The steps do not run as a fixed sequence. Different events start different steps, and a step can run many times before another one runs at all.

| Step | Works on | Captures | Never |
|---|---|---|---|
| **[Collect](collect.md)** | Facts from any source, such as sessions, code bases, existing knowledge, and the user | Records, and updates to record metadata | Interprets a fact, or changes a record's fact |
| **[Link](link.md)** | Records | Associations | Changes a record, draws a conclusion that goes beyond the facts, or forms a question |
| **[Analyze](analyze.md)** | Records, associations, its own earlier work | Claims, inferences, findings, questions, proposals | Publishes, or changes an output |
| **[Approve](approve.md)** | Proposals | Decisions on changes, and publications | Publishes anything that is not approved |

Knowledge moves through the steps in one direction. Records become associations, records and associations become findings, findings that hold up and are worth proposing become proposals, and approved and published changes become versions of outputs. Those versions are recorded as facts, which closes the loop without any step depending on one above it. Each arrow in that chain is traceable in reverse, from any version back to the evidence behind it (principle 2).

## Properties that hold across the process

The following properties hold for every step and every run.

- **Only Collect writes records.** Every other step reads records and never writes one, and never changes their metadata. A step that needs a record checked again asks Collect to do it, and Collect does not need to know which step asked.
- **Records are never edited.** A record's fact stays as it was captured, and every change to Archon's understanding happens in metadata or internal knowledge (principle 3).
- **Everything is traceable.** Every finding, change, and version links back to its evidence (principle 2).
- **Nothing reaches agents without approval.** No output is published and nothing is written into a project unless the change is approved (principle 12).
- **History is kept.** Every revision to metadata, internal knowledge, or outputs is recorded, including what was superseded, rejected, deferred, or withdrawn (principle 10).
- **Work is incremental.** New knowledge is added to what is already known, and earlier work is not repeated because new knowledge arrived (principle 11).
- **Steps depend only downward.** Each step depends only on what the steps beneath it expose, never alters what they hold, and can be modified, rebuilt, or replaced without changes to them (principle 19).
