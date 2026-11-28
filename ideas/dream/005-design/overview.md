# Archon: Technical design overview

**Layer:** 005, Technical design
**Status:** Draft

This layer turns the requirements in layer 004 into a technical design. It names Archon's components, the technologies each one uses, the kinds of information each one keeps, and the technical requirements each one meets. Each technical requirement cites the layer 004 requirements it serves.

Each component has its own file in this folder.

| File | Prefix | What it covers |
|---|---|---|
| `overview.md` | | The components, how they are arranged, and the implementation language. |
| `analyze.md` | AZD | The dependency index, rule-based facts, source tracing, opportunity detectors, investigation, sameness, the holds-up check, questions, worth proposing, and proposal drafting. |
| `approve.md` | APD | Change intake, the decision path, versions, existing knowledge edited by hand, and rollback. |
| `collect.md` | CLD | Platform adapters, the event view, what starts Collect's work, code base and existing-knowledge capture, user-input intake, and checks. |
| `exposure.md` | EXD | Managed files, the published-outputs directory, the MCP server, how scopes are matched to work, and the exposure job. |
| `link.md` | LKD | Linkers, the shapes of association, the fuzzy method, the content index, and how Link follows outdated records. |
| `measurement.md` | MSD | Replays of comparable past tasks in two arms, their metrics, and comparison after publication. |
| `model-access.md` | MDA | The model gateway, its providers, the registry of uses, call records, secret removal, and limits. |
| `runtime.md` | RUN | The processes Archon runs as, how they start and communicate, and how work in each component is started. |
| `storage.md` | STO | The storage interface, the namespace each step keeps and what it holds, and the engines behind the interface. |
| `user-surface.md` | USD | The desktop app where the user reviews, decides, answers questions, gives notes, rolls back, and starts measurements. |

---

## Components

Archon is divided into the four steps that layer 003 defines, plus exposure, measurement, and a surface for the user. Each step is one component, and each component builds only on the components beneath it (principle 19). A small foundation sits beneath all of them.

| Component | Builds on | What it is |
|---|---|---|
| **Storage** | | The storage interface that every component uses, a namespace for each step, and the engines that keep the data behind the interface. |
| **Runtime host** | | The service, its clients, local IPC, the job runner, and the request queue. |
| **Model access** | | The model gateway, with local embedding models and judgment through the agent platforms' command line tools. |
| **Collect** | Foundation | Records facts as files with a catalog, and checks records again on request. |
| **Link** | Collect | Derives associations between records, and indexes record content for search. |
| **Analyze** | Link, Collect | Derives claims, inferences, findings, questions, and proposals. |
| **Approve** | Analyze, Collect | Holds decisions on changes, and the outputs and versions that approval makes. |
| **Exposure** | Approve, with the tags of work from Analyze and Collect | Gives agents on every supported platform direct access to published outputs. |
| **Measurement** | Approve, Analyze, Link, Collect | Measures the effect of a change, such as by replaying comparable past tasks. |
| **User surface** | Approve, Analyze, Measurement, Link, Collect | A desktop app that shows changes with their evidence, puts questions to the user, and passes everything the user states to Collect as user input. |

## Implementation language

Archon is written in Rust, and the front end of the desktop app is written in TypeScript. Every component runs on the user's machine (DAT-1).

## How technical requirements are written

Technical requirements follow the form that layer 004 uses. Each one has an identifier made of its file's prefix and a number, such as STO-1. It opens with a bold sentence that states the rule, followed by one or two sentences that cite the layer 004 requirements it serves, and it ends with a list of acceptance criteria that each pass or fail against the design or a running system.
