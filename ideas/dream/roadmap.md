# Archon design roadmap

**Status:** Proposed

This roadmap lists the layers of Archon's design in the order they are meant to be written. Each layer is a folder of files. Each layer answers a narrower question than the one before it, and no layer decides anything that a higher layer still depends on. The sequence is a proposal, and any change to it is agreed with the user before the affected layer is written.

| Layer | Folder | Subject | Status |
|---|---|---|---|
| 001 | `001-abstract/` | Abstract | Proposed |
| 002 | `002-concepts/` | Concepts | Proposed |
| 003 | `003-process/` | Process | Proposed |
| 004 | `004-requirements/` | Requirements | Planned |
| 005 | `005-design/` | Technical design | Planned |
| 006 | `006-delivery/` | Delivery | Planned |

Layers 001 through 003 are conceptual. They describe what Archon is, the principles it operates by, its goals and non-goals, the kinds of things it works with, and the properties its process keeps. They contain no implementation details, schemas, contracts, or technology choices. Layer 004 adds requirements without deciding how they are met. Layer 005 is the first layer that makes technical decisions.

## 001, Abstract

This layer states what Archon is and why it exists. It holds one file for the abstract and purpose, one for the numbered principles, one for scope and non-goals, and one file for each illustrative scenario.

The purpose of this layer is to fix the rules that every later layer has to keep.

## 002, Concepts

This layer defines the kinds of things that Archon works with, with one file for each concept and an overview that groups them. For each concept, it states what the thing is, how it relates to the others, and what makes two instances the same. It does not describe how the process works or how anything is stored.

The purpose of this layer is to give every later layer one shared meaning for each term. Principles 4, 5, 8, and 9 depend on distinctions that layer 001 names without defining, and those definitions belong here.

## 003, Process

This layer describes how the concepts relate as Archon works, and it is the first layer to name the steps of the process. It holds an overview, one file for each of the four steps (collect, link, analyze, and approve), and one file for each topic that spans steps: the lifecycles of findings and changes, questions, exposure of approved outputs to agents, and rollback. For each step it states what the step works on, what it captures, and the properties that hold, and the overview states the properties that hold across all steps.

The purpose of this layer is to make principle 19 concrete. When each step depends only on what the steps beneath it expose, any step can be modified, rebuilt, or replaced without changes to the steps it builds on.

## 004, Requirements

This layer turns layers 001 through 003 into requirements that must hold true however Archon is designed. It states what is required and leaves how it is met to layer 005. It covers requirements for each step and the quality requirements that the principles imply, such as the following.

- Incremental processing of new experience.
- Collection that adds no second record when the same thing is collected again.
- Traceability from every output back to its evidence.
- Limits on model use that follow from principle 17.
- Support for multiple agent platforms.
- Reversibility of every published change.
- The possibility of measuring a proposal's effect, so that layer 005 cannot rule it out.

Each requirement carries acceptance criteria. Terms such as "relevant," "promising," and "supported" receive thresholds here, or they are explicitly recorded as open.

The purpose of this layer is to give the technical design a fixed target to be verified against.

## 005, Technical design

This layer converts the requirements in layer 004 into technical requirements and defines the actual flow and design of the system. It covers Archon's components, their boundaries, where they run, and how they connect. It decides what starts Link and Analyze and how often each one runs, how facts are captured from each agent platform, where the record and the derived knowledge are stored, how associations are represented, how agents access approved outputs directly and how direct access matches their work to applied scopes, and how outputs are published into project files in a form that every supported agent can load. It also designs the measurement of a proposal's effect, including the replay-based measurement that principle 16 sets as a core goal and the extraction and output metrics drawn from `000-raw/storage.md`. The temporal knowledge graph and vector search described in `000-raw/storage.md` are evaluated here as options alongside alternatives.

The purpose of this layer is to choose a structure that meets the requirements in layer 004 while keeping the steps separate.

## 006, Delivery

This layer defines a phased delivery of Archon. It sets the milestones, the goal of each milestone, and the acceptance criteria that each one has to meet before the next one begins. It includes a first experiment that tests the central assumption before the full system is built.

The purpose of this layer is to hold Archon to the same rule that Archon applies to agents, which requires evidence that a change helps before it is adopted.

## Ordering decisions

Concepts come before process because a process written before its terms are fixed ends up defining those terms implicitly and inconsistently. Requirements come before technical design so that the design has a fixed target, and the requirement that measurement be possible is placed in layer 004 so that the design cannot rule it out. Delivery comes last because its milestones and acceptance criteria depend on the components that the technical design defines.
