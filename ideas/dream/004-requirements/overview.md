# Archon: Requirements overview

**Layer:** 004, Requirements
**Status:** Draft

This layer states the requirements that hold however Archon is designed. Each requirement follows from a principle in layer 001, a definition in layer 002, or a step or property in layer 003, and it cites that source. Each one carries acceptance criteria, so a design or a running system can be checked against it.

Each step has its own file, and so does each quality that spans steps.

| File | Prefix | What it covers |
|---|---|---|
| `overview.md` | | How requirements are written, and the meaning of terms that need a threshold. |
| `collect.md` | COL | Recording facts and keeping record metadata current. |
| `link.md` | LNK | Deriving associations between records. |
| `analyze.md` | ANL | Claims, findings, and proposals. |
| `outputs.md` | OUT | The kinds of output, and existing knowledge as output. |
| `questions.md` | QST | Forming, ranking, answering, and withdrawing questions. |
| `approve.md` | APR | Decisions on changes. |
| `exposure.md` | EXP | How published outputs reach agents. |
| `separation.md` | SEP | Keeping the steps separate. |
| `traceability.md` | TRC | Tracing every output back to its evidence, and keeping history. |
| `reversibility.md` | REV | Rolling back published changes by taking back their approval. |
| `incremental.md` | INC | Taking in new experience without reprocessing earlier work. |
| `model-use.md` | MOD | Which methods a step uses, and when model judgment is used. |
| `platforms.md` | PLT | The agent platforms Archon learns from and serves. |
| `measurement.md` | MEA | Keeping it possible to measure a proposal's effect. |
| `data-handling.md` | DAT | Where data is kept, and sensitive content. |

---

## How requirements are written

Each requirement has an identifier made of its file's prefix and a number, such as COL-2. An identifier names one requirement for as long as the layer exists, so later work can cite it.

A requirement opens with a bold sentence that states the rule. One or two sentences follow, giving its source in a higher layer. A list of acceptance criteria comes last. Each criterion is a check that either passes or fails against a design or a running system.

## Terms with thresholds

Several terms in the higher layers name a bar that a finding, a claim, or a step has to meet. This layer gives each one its meaning.

| Term | Meaning |
|---|---|
| **Holds up** | A finding holds up when at least one independent source rooted in an observation or in user input supports it, and no evidence contradicts it in the same period. Agent inferences contribute only the observations and user input they rest on (layer 002, inference), so a finding whose only sources are agent statements does not hold up, and an agent statement that rests on nothing contradicts nothing. Existing knowledge contributes only the claims it states (layer 002, existing knowledge), so it also needs such a source. |
| **Worth proposing** | A judgment that Analyze makes about a finding that holds up. It has no fixed criteria. Each judgment is an inference, recorded with its reasons, and it can be revised. |
| **Promising** | A judgment that an opportunity deserves expensive reasoning (principle 17). It has no fixed criteria. Each judgment is recorded with its reasons, and it can be revised. |
| **Covers** | An applied scope covers a piece of work when the work carries the same tag, either in the metadata of its records or as a tag that needs judgment (layer 002, tag). A scope of general knowledge covers all software work (layer 001, scope). A scope covers a project when it covers the work in that project. |
| **May be relevant** | What a step exposes to the steps above it (principle 19). A step exposes everything it holds that may bear on the work above it, described by what it holds. It never infers or assumes what a step above does or how that step works, as SEP-3 states. |
