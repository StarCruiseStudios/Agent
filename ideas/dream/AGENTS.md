# Archon design folder

This folder holds the design of Archon, a system that records what AI coding agents do, analyzes that record across sessions and projects, and proposes evidence-backed changes to the memory, practices, and skills that agents use. The folder is named `dream` for historical reasons. The project is called Archon, and the design documents avoid the word "dream."

The design is written in layers, and each layer is a folder. The first layer is the most abstract, and each later layer adds detail and moves closer to an implementation. A lower layer may refine a higher one, but it never contradicts it.

## Files

| Path | What it is |
|---|---|
| `001-abstract/` | Layer 001. `abstract.md` states what Archon is and its purpose. `principles.md` holds the numbered principles. `scope.md` covers outputs, users, what Archon learns from, and non-goals. Each `scenario-*.md` file is one illustrative scenario. Every later layer must stay consistent with this layer. |
| `002-concepts/` | Layer 002. `overview.md` groups the concepts and shows how the groups relate. Every other file defines one concept: what it is, how it relates to others, and when two instances count as the same. |
| `003-process/` | Layer 003. `overview.md` describes how the steps relate and the properties that hold across them. `collect.md`, `link.md`, `analyze.md`, and `approve.md` each describe one step. The remaining files cover topics that span steps: the finding and change lifecycles, questions, exposure of approved outputs to agents, and rollback. |
| `004-requirements/` | Layer 004. `overview.md` lists the files and their requirement prefixes, says how requirements are written, and gives the meaning of terms that need a threshold. Each step and exposure has its own file, outputs and questions have one each, and so does each quality that spans steps: separation, traceability, reversibility, incremental work, model use, platforms, measurement, and data handling. |
| `005-design/` | Layer 005. `overview.md` lists the components, how they are arranged, the implementation language, and how technical requirements are written. Each designed component has its own file, such as `storage.md` for the storage interface and the namespace each step keeps, `runtime.md` for the processes, IPC, job runner, and request queue, `model-access.md` for the model gateway, `collect.md` for the design of Collect, `link.md` for the design of Link, `analyze.md` for the design of Analyze, `approve.md` for the design of Approve, `exposure.md` for the design of exposure, `measurement.md` for the design of measurement, and `user-surface.md` for the desktop app. |
| `roadmap.md` | The planned sequence of layers, with the subject and purpose of each one and the reasons for the order. |
| `voice.md` | The voice guide for every document in this folder. It covers traits, vocabulary, grammar and mechanics, examples, and a revision checklist. |
| `000-raw/dream.md` | The user's original short notes on the idea. |
| `000-raw/storage.md` | The user's original longer exploration, centered on a temporal knowledge graph combined with vector search. |
| `AGENTS.md` | This file. |

## What each layer may contain

Each layer records definition. It states what Archon is and does at that layer's level of detail, and it adds only the detail that level needs. It does not record design choices, the alternatives considered, or the reasons one option was picked. Detail that can wait for a lower layer is left out, so that requirements can be defined one layer at a time. A layer that runs ahead of itself fixes answers that the requirements layer was meant to work out, and every such answer has to be found and removed later.

Layers 001 through 003 are conceptual. They describe the properties of the system, the principles it operates by, and its goals and non-goals. They contain no implementation details, schemas, contracts, or technology choices.

| Layer | Contains | Never contains |
|---|---|---|
| **001, Abstract** | What Archon is and why, the numbered principles, scope and non-goals, and illustrative scenarios. | How Archon is divided into steps, or any term that needs a definition before it can be used. |
| **002, Concepts** | The kinds of things Archon works with. For each one, what it is, how it relates to the other concepts, and when two instances count as the same. | How anything moves, changes state, is triggered, or is decided. A sentence that says what happens when something occurs belongs to layer 003 or lower. |
| **003, Process** | The steps, what each one works on and captures, how the steps depend on one another, the lifecycle states, and the properties and invariants that hold across them. | Mechanisms: what triggers a step or how often it runs, how a step does its work, how agents query or load outputs, how conflicts between changes are resolved, how versions are matched or merged, and who performs an action when no higher layer names them. |
| **004, Requirements** | Requirements that must hold however Archon is designed, with acceptance criteria and thresholds. | Technical decisions. |
| **005, Technical design** | Technical requirements derived from layer 004, and the actual flow and design of the system. | Delivery milestones. |
| **006, Delivery** | A phased delivery timeline with milestones, goals, and acceptance criteria. | New requirements or design. |

### Checking that a layer stays at its level

Run these checks on every sentence of a draft before handing it to the user.

- **Is it forced?** A sentence that picks one of several workable answers, when no higher layer forces that answer, is a lower-layer choice. Remove it. A sentence that follows from a principle or from a higher layer's definition stays, and it cites that principle by number.
- **Is it a definition?** State what something is and what always holds. Do not record that a choice was made, which options were rejected, or why.
- **Does it point downward?** A layer never names a lower layer, never says that something is "left to" or "settled by" a later layer, and never keeps a list of open items for later layers. Deferred material is left out entirely.
- **Does it fit the concept or step it is in?** A step's work stays within its own definition. A step defined as never interpreting facts is never given work that needs judgment, such as assigning topic tags or deciding who wrote something. A step defined as stating only facts never forms questions.
- **Does it restate a principle?** Cite the principle by number instead of repeating its rule.
- **Does it use an undefined term?** Every term that names a thing Archon works with is defined in layer 002. When layer 003 needs a new term, such as a new kind of event or role, ask the user whether to add it to layer 002 or leave it out.
- **Does its sameness rule mean something?** A rule such as "two changes are the same when they are the same change" says nothing. When a sameness rule needs judgment, say that the judgment is an inference that can be revised, and do not invent its criteria.

### Mistakes made before

Earlier drafts of layers 002 and 003 made the following mistakes, and each one had to be removed.

- Lists of deferred items and phrases such as "layer 004 sets the threshold" or "left to layer 005."
- Process rules inside concept files, such as what happens to an association when a record is flagged as outdated, or how applied scopes are chosen at approval.
- Triggers and schedules in the process layer, such as "nothing in Archon watches for this on its own" and a fixed list of events that start a check.
- Rules for resolving conflicts and versions, such as rebuilding a change against a newer base version, sending changes back to review when another change is published, and how two pending changes on the same output are handled.
- Roles and steps that no higher layer asked for, such as a separate release step after approval, a named reviewer, a review queue, and a user request that counts as approval and publishes at once.
- Detail about how agents use outputs, such as how an agent asks for, browses, and reads outputs.
- Platform detail in a concept, such as the parts of a session forming a tree when a conversation is forked.

## Authority

The layered documents are the agreed definition of Archon. The raw notes are source material. When they disagree, the layered documents win, because each layer was settled with the user after the raw notes were written.

The following conflicts between the raw notes and layer 001 are already resolved, and they should not be reopened unless the user raises them.

- `000-raw/storage.md` treats the knowledge graph and vector search as the center of the project. In layer 001 the center is the purpose of helping future agents decide better from past experience, and storage is a decision for layer 005.
- `000-raw/dream.md` lets memory be promoted with high automation and gates only skills on evaluation. In layer 001 every change that agents load is approved first, and memory, practices, and skills all meet the same evidence bar. Archon may update its own internal knowledge without approval.
- The raw notes list backlog tasks, architecture documentation, and research questions as outputs. Layer 001 limits outputs to memory, practices, and skills. Questions for the user are part of the process, and they are never an output.
- The raw notes describe the system as "dreaming." Layer 001 describes each step literally.
- `000-raw/storage.md` discounts repeated observations of the same assumption. Layer 001 records how often a claim appears and keeps that count separate from how well the claim is supported.

The raw notes still hold useful material for lower layers, such as candidate categories, scoring factors, lifecycle states, evaluation metrics, and technologies to investigate. Treat each of these as a proposal to bring to the user, never as a decision already made.

## Writing a new layer

1. Read every file in `001-abstract/`, every later layer that exists, `roadmap.md`, and `voice.md` in full before writing anything. Read both raw notes for source material.
2. Confirm with the user which layer is being written before drafting it. `roadmap.md` proposes the sequence and the purpose of each layer, and the sequence changes only when the user agrees. A layer's status is **Planned** before it is written, **Draft** while it is being written and reviewed, and **Proposed** once the user agrees that it is complete and coherent. Set the status in `roadmap.md` and in the header of every file in the layer, and change it to Proposed only when the user says so.
3. Create the layer's folder with the next three-digit number and the short name in `roadmap.md`, such as `004-requirements/`. Split the layer into files by topic, with an `overview.md` when the layer has more than one file. Start every file with the same **Layer** and **Status** header that the files in `001-abstract/` use.
4. Keep the layer within what the section above allows it to contain. Content that belongs to a lower layer is left out entirely. It is never written early, and the layer neither lists it as open nor names the layer that will settle it.
5. Do not make assumptions. Anything that is ambiguous, underspecified, or in conflict between the raw notes, the existing layers, and the new material is taken to the user as a question, as long as it belongs to the layer being written. Ask in small batches, write each answer into the layer as definition, and keep checking the draft until no ambiguity or assumption remains.
6. Stay consistent with every higher layer, and cite its principles by number instead of restating them. When the new layer needs a higher layer to change, ask the user first. Then update the higher layer and the new layer together.
7. When the user defers a decision to a later layer, leave it out of the text. A deferred decision is never filled in with a guess, and it is never recorded as open. Before asking the user anything, run the checks in "Checking that a layer stays at its level" on the question. A question whose answer would be a lower-layer choice is not asked, and the draft leaves that point out.
8. Write in the voice that `voice.md` defines. Before handing the layer back to the user, run the voice guide's drafting and revision checklist and the level checks above, and read the layer once more against every higher layer for contradictions.
9. Update the file table in this document whenever a file or folder is added, renamed, or moved.
