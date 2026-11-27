# Archon: Principles

**Layer:** 001, Abstract
**Status:** Proposed

These principles bind every later layer. They are numbered continuously across the groups so that any one of them can be cited by number, and later layers cite them instead of restating them.

---

## Evidence

1. **Learn from what agents did.** Diffs, test results, command output, human corrections, and the code base itself show what actually happened. The conversation is read too, but the observed record carries more weight than an agent's account of it.
2. **Trace everything.** Every piece of knowledge and every proposal links back to the experience that supports it. Memory, practices, and skills all meet the same bar.
3. **Never edit the record.** Archon's interpretation of a record can change as often as it needs to, and the record itself stays exactly as it was captured. A record of something that can change, such as a code base, is checked again over time, and when it no longer holds, it is marked as outdated and a new record is added.
4. **Keep observations apart from inferences.** An agent's conclusion is a hypothesis until evidence supports it. What was observed and what was inferred are stored as separate things.
5. **Track how often a claim appears, apart from how well it is supported.** A recurring assumption is useful information in its own right, so Archon records every time it appears. Frequency alone never makes a claim true or worth promoting. When several sessions repeat an assumption that traces back to one source, the repetition shows how widely the assumption has spread, and the claim's support is still that one source.
6. **Treat user notes as evidence.** Notes and suggestions can be given to Archon directly. They are kept exactly as written and weighed alongside recorded experience whenever an output is generated or proposed.
7. **Ask when unsure.** When the evidence is ambiguous or conflicting, Archon forms a question for the user, and the answer joins the evidence.

## Knowledge

8. **Separate what is from what to do.** Memory describes how a project works. Practices and skills prescribe how agents should work on it. The two kinds of knowledge are kept distinct.
9. **Know where knowledge applies.** A lesson learned in one place is classified by scope and origin before it is used anywhere else. A user preference is never presented to agents as a general rule, and knowledge from one project is never applied to another unless its scope covers both.
10. **Keep the history.** Every change to Archon's knowledge is recorded, including what was superseded and what was rejected. A dropped belief and an unresolved contradiction both remain useful evidence.
11. **Learn incrementally.** New experience updates what Archon knows without reprocessing everything recorded before it.

## Change

12. **Approve what agents load.** Archon updates its own internal knowledge freely. Memory, practices, and skills that agents use change only through proposals, and a proposal goes live only once it is approved.
13. **Read what already exists.** Hand-written instructions, agents' built-in memory, and existing skills are treated as current knowledge. Changes to them may be proposed, and those proposals follow the same approval rule as any other.
14. **Make every change reversible.** Published changes are versioned, so any of them can be rolled back or replaced.
15. **Keep published knowledge current.** Published knowledge rests on facts and on what Archon concluded from them. When those facts or conclusions change, the knowledge built on them is checked again, and a revision or retirement is proposed when it no longer holds.
16. **Show that a change helps.** Archon aims to measure a proposal's effect before it is reviewed, for example by replaying comparable past tasks with and without the change. This is a core goal, and changes may still be proposed before that measurement is possible.

## Operation

17. **Use a script when a script will do.** Deterministic code and ordinary algorithms come first, and model judgment and summarization are kept for work that needs them. Cheap methods find the opportunities, and expensive reasoning goes only to the promising ones.
18. **Work with any agent.** Archon learns from several coding agent platforms and their subagents, and any supported agent can use what it publishes.
19. **Build each part only on the parts beneath it.** Archon is divided into parts, and each part builds on what the parts beneath it expose. Any part can be modified, rebuilt, or replaced without changes to the parts it depends on, so changing how records are related never requires changing how facts are recorded. A part keeps its own knowledge to itself and never alters what a part beneath it holds. Each part exposes everything it holds that may be relevant to the parts above it, described by what it holds and never by how it works or how a later part will use it.
