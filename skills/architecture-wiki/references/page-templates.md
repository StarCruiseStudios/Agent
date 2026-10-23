# Page templates

All pages begin with the OKF front matter defined in [wiki-layout.md](wiki-layout.md) and end with the common ending below. The templates show the body only: the first line is the `# <Title>` heading after the frontmatter. Drop sections that do not apply. Keep headings as written so pages stay consistent.

Every section is also subject to [detail-level.md](detail-level.md): on landscape, area, and system pages, say what is stable (roles, responsibilities, relationships) and link to listings and lower pages for the changing detail, so "Key flows", "Key entities", and similar sections summarise the few that define the subject and point to the `index.md` listing for the full set.

Every section is subject to the grounding rules in [citations.md](citations.md). The templates show structure, not content: each sentence, table row, list item, and diagram element that states a fact carries an inline citation, tables include a Source column (or per-cell citations), and each diagram is followed by a "Diagram sources" list. Prompts such as "table: component | role | paths" imply a Source column.

## Common ending

```markdown
## Open questions
- <What could not be confirmed, with where to look>

## Related
- [Page](/path/to/page.md): how it relates
```

The main sources are not a body section. They go in the `sources` frontmatter field as an index for readers who want to start reading code, and in `sources_commit` (or `sources_commits` for several repos) with `generated.at` for revision. Inline citations in the body remain the per-claim attribution (see [citations.md](citations.md)). A footnote keyed to a `sources` id is an acceptable alternative for a claim that already has a `sources` entry.

## System

A system page is `areas/<area>/systems/<system>/overview.md` (`type: System`). It is the system's overview. Its folder's `index.md` is the OKF listing. It is the C4 system level: it shows the system's containers and its external users and systems.

```markdown
# <System>

<Paragraph: what it is, who or what uses it, and why it exists.>

## Code location
Table: repo | paths | what is there. Cover every repo that holds part of the system, including infrastructure, schema, and configuration repos. Note repos referenced but not yet located.

## Responsibilities and boundary
What it owns and what it deliberately does not.

## Architecture
Container diagram (Mermaid) showing the system's containers, its users, and the external systems it talks to. Table: container | role | technology | repo and path, linking each container page if it exists.

## Key flows
Each main flow in two to four sentences, linking its page if it exists.

## Key entities
Each important entity in one or two sentences, linking its page if it exists.

## Interfaces and dependencies
Inbound APIs, events, and UIs; outbound services, datastores, queues; configuration that selects them.

## Runtime and deployment
How it is built, packaged, run, and scaled.

## Design decisions and constraints
Decisions visible in the code, with the reason when evidenced. Label inference.

## Pages in this system
List grouped by Containers, Flows, Entities, and Concepts, one line each. Omit empty groups.

## Wider scope
Area-level and landscape-level flows, entities, and concepts this system takes part in, each linked with one line on this system's role. Also the domains it implements, linked to their pages.
```

## Area

An area page is `areas/<area>/overview.md` (`type: Area`). The folder's `index.md` is the OKF listing.

```markdown
# <Area>

<Paragraph: what this group of systems is for and how the systems relate.>

## Systems
One line per system, linked to its page.

## How the systems fit together
Mermaid diagram and a short description of the main interactions between the area's systems and with other areas.

## Pages in this area
Area-level flows, entities, and concepts, one line each.

## Landscape-level material
Landscape flows, entities, and concepts the area takes part in.
```

## Landscape

The landscape page is the root `overview.md` (`type: Landscape`). The root `index.md` is the OKF listing. The page states what the overall system is, a diagram of areas and their relationships, links to `areas/catalog.md`, `domains/index.md`, and the backlog, and the landscape-level flows, entities, and concepts, one line each.

## Container

A container is a separately runnable or deployable unit inside a system: a service, web or mobile app, worker, scheduled job, CLI, database, or message queue. It is `areas/<area>/systems/<system>/containers/<container>/overview.md` (`type: Container`) at the C4 container level.

```markdown
# <Container>

<Paragraph: what it is, the technology it runs on, and its role in the system.>

## Code location
Table: repo | paths | what is there. Paths are relative to the repo root and nested within the system's locations. Note any paths shared with other containers.

## Responsibilities
What it does and does not do.

## Components
Component diagram (Mermaid) and a table: component | role | paths, linking component pages if they exist.

## Interfaces
APIs, events, and UIs it exposes; what it calls or consumes; datastores it owns or uses.

## Runtime and deployment
Build and packaging, configuration, how it is deployed and scaled.

## Key flows and entities
Summaries linking pages if they exist.

## Design decisions and constraints

## Pages in this container
List grouped by Components, Flows, Entities, and Concepts, one line each.

## Wider scope
System-, area-, and landscape-level pages it takes part in, with one line on its role.
```

## Component

A component is a grouping of related code inside one container, such as a module, subsystem, or layer with a clear responsibility. It is a single page at `.../containers/<container>/components/<component>.md`, at the C4 component level. Open with a link back to the container.

```markdown
# <Component>

<Paragraph: what it is and what responsibility it carries within the container.>

## Code location
Table: repo | paths (folders or files) | what is there. Nested within the container's locations.

## Responsibilities
## Structure
Key classes or modules and how they fit together, grouped by purpose, with links to deep-wiki pages if they exist.

## Interfaces and collaborators
What it exposes, and what it depends on within and outside the container.

## Behaviour and design notes
```

## Domain

A domain is described in business terms, independent of implementation. It has a folder at `domains/<domain>/` (see [wiki-layout.md](wiki-layout.md)). Its overview is `overview.md` (`type: Domain`), its glossary `glossary.md` (`type: Glossary`), and its rules `rules.md` (`type: Rules`).

`overview.md`:

```markdown
# <Domain>

<Paragraph: the business or problem area and why it matters.>

## Scope and boundaries
What is in and out of the domain, and how it interacts with neighbouring domains.

## Capability map
Table: capability | description | implementing systems (linked) | coverage notes (complete, partial, gaps).

## Key entities and processes
One line each, linking the domain's `entities/` and `flows/` pages.

## Pages in this domain
Glossary, rules, entities, and flows, one line each.
```

`glossary.md` is a table: term | meaning in this domain | code names | notes on conflicting uses elsewhere.

`rules.md` is a list of rules. For each: the rule in plain words, where it is enforced (links to code or system pages), whether enforcement is complete, and the source of the rule if known.

Domain entities and flows use the Entity and Flow templates, focused on business meaning and linking to the technical pages at system, area, or landscape scope.

## Flow

```markdown
# <Flow>

<Paragraph: what triggers it, what it achieves, and who is involved.>

## Participants
Table: system, container, or component | part it plays, linking each page. A flow at area or landscape scope lists the systems it spans in the `systems` front matter field and describes only the cross-system behaviour; each system's internal steps are summarised and linked.

## Sequence
Mermaid sequenceDiagram, then numbered steps with links to code.

## Data and state
What is passed, stored, and changed at each step.

## Failure, retry, and consistency
Error paths, retries, timeouts, idempotency, ordering guarantees.

## Variations
Alternative branches or modes, briefly.
```

## Concept

```markdown
# <Concept>

<Paragraph: the idea, and the problem it solves in this system.>

## How it is realised
Mechanism, key abstractions, and where they live.

## Where it applies
Systems, flows, or entities that rely on it, linking pages if they exist.

## Working with it
Rules, conventions, and pitfalls for people changing code that uses it.

## Trade-offs and alternatives
Why this approach; what was not chosen when evidence exists.
```

## Entity

```markdown
# <Entity>

<Paragraph: what it represents and why it exists.>

## Shape
Fields grouped by meaning. Table: field | type | meaning. Add a Mermaid erDiagram or classDiagram when relationships matter.

## Identity and lifecycle
How it is created, identified, changed, and retired. State diagram if it has states.

## Invariants and rules

## Storage and exchange
Where it is persisted and how it is serialised or exposed.

## Relationships
Other entities, with cardinality.

## Used by
Systems and flows that create or consume it, one line each.
```
