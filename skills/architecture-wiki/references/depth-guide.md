# Depth guide

Each page has a **primary subject** (covered in full for its type) and **neighbours** (anything it mentions that has or deserves its own page). Neighbours get a summary: what it is, its role relative to the subject, and a link if a page exists. A neighbour never gets its own detailed section.

Every fact in a neighbour summary is cited to the neighbour's own source, like any other claim (see [citations.md](citations.md)). If you have no source for a fact, leave it out.

Rule of thumb: if a neighbour's description exceeds a short paragraph, stop and record the extra in the backlog. If you already learned the detail, keep one or two sentences of it in the neighbour summary rather than discard it.

Depth says how much of the subject a page covers. The level of detail within it is set by the page's altitude, so a high-level page covers its subject through roles and relationships, not inventories (see [detail-level.md](detail-level.md)).

## Primary depth by type

| Type | Include at primary depth | Summary depth only |
| --- | --- | --- |
| system | Purpose, boundary, responsibilities; code locations (repos and paths); container diagram and table; main flows as short summaries; key entities and what they represent; external dependencies and interfaces; deployment and runtime shape; important design decisions and constraints | Internals of each container, step-by-step flows, entity fields and lifecycle, per-symbol behaviour |
| container | Role and technology; code locations; components with diagram; interfaces and datastores; runtime and deployment; key flows and entities as summaries; design decisions | Internals of each component, step-by-step flows, entity fields and lifecycle |
| component | Responsibility; code locations; structure grouped by purpose; interfaces and collaborators; behaviour and design notes | Per-symbol detail (use deep-wiki), flows that merely pass through |
| domain | Business meaning, vocabulary, rules and invariants; which systems implement it; key entities and flows with one-line roles; boundaries with adjacent domains | Implementation detail of each system, full entity models |
| flow | Trigger and outcome; participating components; ordered steps with sequence diagram; data passed at each step; failure, retry, and consistency behaviour; performance or ordering constraints | Internals of participants, definitions of entities involved |
| concept | The idea and why the system needs it; how it is realised (mechanism and where it lives); where it applies; rules for working with it; trade-offs | Detailed behaviour of each place it is used |
| entity | What it represents; fields grouped by meaning; identity and lifecycle (states and transitions); invariants; where it is stored, created, changed, and consumed; relationships to other entities | Logic of the flows and systems that manipulate it |

## Depth across scopes

Document at the system level by default: the system page carries its purpose, containers, main flows, and entities, and its folder holds the deeper container and component pages as they are explored. A page at area or landscape scope covers only what is true across that scope (the contract between systems, ordering, shared data, consistency across boundaries). Each system's internal detail stays in that system's folder, and the wider page links to it or backlogs it. Domain pages stay at business level and link to technical pages for implementation.

## Depth levels

Record the level in the `depth` frontmatter field.

- **overview:** purpose, shape, and the main moving parts. The reader can orient themselves. A typical first pass for large subjects.
- **standard:** the primary-depth column above is fully covered. Default.
- **deep:** adds detailed edge cases, failure modes, configuration, and history of design decisions. Use when the user asks, or when extending a page.

When a page already exists at a lower depth and the user asks for more, extend it in place and raise the level.

## What goes in the backlog

- A neighbour that is central to the subject and would need more than a paragraph to explain.
- Code paths, modules, or configuration you identified but did not read.
- Behaviour you could not explain from the code (missing context, external system, runtime data).
- Existing wiki pages you suspect are now incorrect.
