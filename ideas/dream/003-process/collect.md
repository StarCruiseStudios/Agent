# Step: Collect

**Layer:** 003, Process
**Status:** Proposed

Collect records facts. A fact can take any form, such as an event in an agent session, the contents of a file, a dependency a code base uses, an instruction an agent already loads, or a note from the user. Collect writes each fact as a [record](../002-concepts/record.md), dated by when it was observed, and it keeps the metadata of records current. It captures facts as they are and leaves their meaning to other steps.

## Where facts come from

The set of places that facts come from is open, and Collect treats them all the same way. The places known so far are the following.

- **Agent sessions.** What happened in a session, from every supported platform.
- **Code bases.** What a code base contains.
- **Existing knowledge.** What agents load, recorded where it was found. This includes the outputs that Archon has published, so a publication becomes a fact like any other.
- **The user.** Notes given to Archon directly, answers to questions, and decisions on changes, with their reasons and any edits made while deciding. Statements the user makes during a session are already facts from that session.

Because publications and decisions are recorded as facts, the steps above Collect learn about them from Collect and never from the step that produced them.

## Checking facts again

Some facts can stop holding, such as what a code base contains, so a record of such a fact can be checked again. Any step can ask Collect for a check, and Collect does not need to know which step asked. A check that confirms the record updates its last-verified date. A check that finds the record no longer holds flags it as outdated and adds a new record.

## Properties

- A record's fact is written once (principle 3). A record of something still in progress, such as a running session, grows as later facts arrive, and the facts already recorded stay as they were.
- Recording the same fact again adds no second record.
- User input is kept exactly as written (principle 6).
- Collect never interprets a fact, and it writes only the metadata that the fact itself shows. Deciding what a statement claims, whether evidence supports anything, which tags that need judgment apply, or who wrote a piece of existing knowledge belongs to [Analyze](analyze.md).
