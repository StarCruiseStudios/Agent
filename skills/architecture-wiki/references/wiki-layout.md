# Wiki layout and central files

The wiki is an [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundle: a directory tree of markdown files in which every page is a **concept** with YAML frontmatter and a required `type`. Follow "OKF conventions" below for frontmatter, links, `index.md`, and `log.md`. The OKF bundle root is the repository root, not the wiki folder. The wiki sits in a folder of the repository (for example `wiki/`), or is the repository root itself, and every link between wiki pages is a bundle-relative path from the repository root.

The wiki is organised by **scope**. There are four nested scopes: the **landscape** (everything), an **area** (a group of related systems), a **system**, and a **container**. Below a container sit **components**, which are single pages. System, container, and component follow the C4 model. A page lives at the narrowest scope that contains everything it describes. Each scope has an `overview.md` concept page and an `index.md` listing, and may have its own `flows/`, `entities/`, and `concepts/` folders for things shared at that scope. Domains are a separate conceptual map with their own structure.

`index.md` and `log.md` are reserved OKF filenames and never hold concepts. A scope's own page is therefore `overview.md`, and its `index.md` only lists contents.

```text
<wiki root>/                              landscape scope; a folder of the bundle (for example `wiki/`)
  index.md                                listing of the wiki (no frontmatter unless the wiki is the repository root)
  overview.md                             landscape concept page
  log.md                                  OKF change log, newest first
  exploration-backlog.md                  central list of everything not yet explored
  glossary.md                             optional; landscape-wide terms
  flows/ entities/ concepts/              things shared across areas
  symbols/                                optional; deep-wiki pages for single code symbols
  areas/
    index.md                              listing of the areas
    catalog.md                            table of every area and system
    <area>/                               area scope
      index.md                            listing of the area's contents
      overview.md                         area concept page
      flows/ entities/ concepts/          things shared across systems in this area
      systems/
        <system>/                         system scope
          index.md                        listing of the system's contents
          overview.md                     system concept page
          flows/ entities/ concepts/      things shared across containers in this system
          containers/
            <container>/                  container scope
              index.md                    listing of the container's contents
              overview.md                 container concept page
              components/<component>.md   one page per component
              flows/ entities/ concepts/  things owned by this container
  domains/
    index.md                              listing of the domains
    <domain>/
      index.md                            listing of the domain's contents
      overview.md                         domain overview and map
      glossary.md                         the domain's ubiquitous language
      rules.md                            business rules, policies, and invariants
      entities/                           business-level entities
      flows/                              business processes
```

Create folders and listings only when the first page that needs them is written. Slugs are lowercase and hyphenated, and unique within their folder. Never create two pages for one subject. Subfolders such as `flows/` have no `index.md` of their own: the scope's `index.md` lists their contents.

## OKF conventions

- **Every non-reserved `.md` file** (including `exploration-backlog.md`, `glossary.md`, `catalog.md`, and any guide) starts with a YAML frontmatter block that has a non-empty `type`. See "Page front matter".
- **`index.md`** has no frontmatter, except that the bundle-root `index.md` (the one at the repository root) carries `okf_version: "0.2"`. Its body is headings that group entries of the form `* [Title](path) - one-line description`. See "Index files".
- **`log.md`** is the change history. See "Log".
- **Concept IDs** are the file path without `.md`. Keep paths stable. Moving a page changes its ID, so fix every inbound link.
- **Links between wiki pages** are bundle-relative paths that start with `/` and are rooted at the repository root, such as `/wiki/areas/payments/systems/billing/overview.md` for a wiki in `wiki/` (or `/areas/...` if the wiki is the repository root). They need no path arithmetic and also resolve on GitHub. A link target that does not exist is tolerated by OKF, but this wiki still forbids dead links (see the link rules in the skill).
- **Unknown frontmatter keys are allowed.** This wiki adds `scope`, `systems`, `locations`, `depth`, and `sources_commit` as extensions.
- **Timestamps** are ISO 8601 with an explicit UTC offset, for example `2026-10-22T14:00:00Z`. Log headings use `YYYY-MM-DD`.

## Where a page goes

Choose the narrowest scope that contains every system the page describes.

1. **One container:** that container's `flows/`, `entities/`, or `concepts/`. A single part of a container that needs its own page is a component page in its `components/` folder.
2. **Several containers, all in one system:** that system's `flows/`, `entities/`, or `concepts/`.
3. **Several systems, all in one area:** that area's `flows/`, `entities/`, or `concepts/`.
4. **Systems in several areas, or the whole landscape:** the landscape-level `flows/`, `entities/`, or `concepts/` at the wiki root.
5. **A whole container, system, or area:** its `overview.md`.
6. **A business or problem concept (not tied to how it is implemented):** under `domains/<domain>/`.

A flow that starts in one container and passes through others belongs at the narrowest scope containing all of them, unless nearly all of its logic is in one container, in which case it stays there and links outward.

**Promotion.** When a page turns out to be used beyond its scope (a container concept used by a second container, an area flow that reaches another area), move it up to the narrowest scope that now contains all its users. Fix every link to it, list it in the new scope's `index.md`, and leave a one-line note in the old `index.md` pointing to the new location. Do the move in the same run and mention it in your reply.

**Inheritance of knowledge.** A page at a wider scope describes only what is true across its scope (contracts between systems, shared data, ordering, consistency across boundaries). Each system's own detail stays in its folder. Narrower scopes summarise the wider pages they take part in and link to them. Cross-scope facts are written once, at the owning scope, and referenced elsewhere.

## Areas

An area is an organisational grouping of systems, such as `payments`, `platform`, or `client-apps`. Follow how the organisation or architecture already groups systems. Every system belongs to exactly one area, and a small landscape with no obvious grouping can use a single area. Areas are not domains: an area is where a system lives, while a domain is a business concept that may be implemented by systems in several areas. Before adding a system, read `areas/catalog.md` and use an existing area when one fits. Do not reorganise silently: if regrouping is needed, move the folders, update all links and listings in the same run, and mention it in your reply.

## Index files and overview pages

Every scope has two files with different jobs:

- **`index.md`** is the OKF listing for the folder. It has no frontmatter (only the `index.md` at the repository root carries `okf_version`). It enumerates the folder's contents so a reader or agent can see what exists before opening pages.
- **`overview.md`** is the scope's concept page, with frontmatter and the template for its type.

### Index files

The body of an `index.md` groups entries under headings. Each entry links to a concept or subfolder and repeats that concept's frontmatter `description`:

```markdown
# Systems

* [Billing](systems/billing/overview.md) - Invoicing and dunning for paying customers.

# Flows

* [Checkout to fulfilment](flows/checkout-to-fulfilment.md) - How an order moves from payment to shipment.

# Subdirectories

* [Billing system](systems/billing/) - Pages for the billing system.
```

Rules for each listing:

- **Repository-root `index.md`:** frontmatter with `okf_version: "0.2"` only. It exists so the bundle declares its version. Create it if missing, with a single entry linking the wiki's `index.md`. Leave any other content the repository owner added.
- **Wiki `index.md`:** no frontmatter (unless the wiki is the repository root, in which case it carries `okf_version`). The body lists `overview.md`, `areas/catalog.md`, `areas/`, `domains/`, `exploration-backlog.md`, `log.md`, `glossary.md` if present, and the landscape-level flows, entities, and concepts. It does not list system-level pages.
- **`areas/index.md`:** lists `catalog.md` and each area folder.
- **Area `index.md`:** the area's `overview.md`, its systems (one line each), and the area-level flows, entities, and concepts.
- **System `index.md`:** the system's `overview.md`, its containers (one line each), and the system-level flows, entities, and concepts.
- **Container `index.md`:** the container's `overview.md`, its components, flows, entities, and concepts.
- **`domains/index.md`:** one line per domain. A domain `index.md` lists `overview.md`, `glossary.md`, `rules.md`, and the entities and flows.

When you add a page, add it to the `index.md` of its folder's scope. When you add a container, also add it to its system's `index.md`. When you add a system, area, or domain, also add it to `areas/catalog.md` and `areas/index.md`, or to `domains/index.md`. A concept's `description` and its index entry must stay in sync.

### Landscape overview and catalog

- **Landscape `overview.md`:** what the overall system is, a landscape diagram or summary, and links to `areas/catalog.md`, `domains/index.md`, the backlog, and the landscape-level flows, entities, and concepts.
- **`areas/catalog.md`** (`type: Catalog`): every area, and a table of every system.

  ```markdown
  | System | Area | Purpose | Repos | Coverage | Link |
  | --- | --- | --- | --- | --- | --- |
  | Billing | payments | Invoicing and dunning | `acme/billing-api`, `acme/billing-web` | standard (12 pages, 4 backlog items) | [billing](/areas/payments/systems/billing/overview.md) |
  ```

  Coverage is the system page's `depth` plus its page count and open-backlog count. Keep them approximate and refresh them when you touch the system.
- **Area `overview.md`:** the area's purpose, how its systems fit together, and links to area-level pages.
- **System `overview.md`:** the system page itself (see templates), with a Pages section linking its containers and system-level pages, and a section linking the wider-scope pages it takes part in.
- **Container `overview.md`:** the container page itself, with a Pages section linking its components, flows, entities, and concepts, and a section linking the wider-scope pages it takes part in.

## Domains

A domain is a business or problem area, described independently of how any system implements it. A domain folder holds:

- **`overview.md`:** what the domain is and why it matters; its scope and boundaries with neighbouring domains; a **capability map** (table of the domain's capabilities and which systems implement each, linking to those system pages); key entities and processes, linked; and the list of pages in the domain folder.
- **`glossary.md`:** the domain's terms and what each means here, including words that mean something different in another domain or in code. Write the domain's own words as the business uses them, and note the code names beside them.
- **`rules.md`:** business rules, policies, and invariants (for example "an invoice cannot be edited after it is issued"), each stating where in the code it is enforced and whether enforcement is complete or only partial. This is where contradictions between systems become visible.
- **`entities/`:** the business meaning of the domain's core entities: what they represent, their lifecycle in business terms, and the relationships between them. The technical shape (fields, storage) lives in the owning system's `entities/` page, which the domain page links to.
- **`flows/`:** business processes described end to end in business terms (for example order to cash), each linking to the technical flows at system, area, or landscape level that realise their steps.

Domain pages describe and link. They do not hold implementation detail. Create `glossary.md`, `rules.md`, and the subfolders only when there is content for them. When you document a system or flow, also check whether a domain page exists for its business area. If one does, update its capability map and rules; if one does not, add a backlog entry of type `domain`.

## exploration-backlog.md

The single place to find what the wiki is missing. It is a concept page (`type: Backlog`). It stays central but is organised by scope so it remains scannable with many systems.

```markdown
---
type: Backlog
title: Exploration Backlog
description: Pages the wiki still needs, questions it could not answer, and content that looks stale.
---

# Exploration Backlog

Entries are removed once resolved. Each entry names the path where its page should go.

## Landscape

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Checkout to fulfilment flow | flow | Needs page | High | `flows/checkout-to-fulfilment.md` | [Billing](/areas/payments/systems/billing/overview.md) | 2026-10-22 | Crosses billing, orders, and shipping; only the billing end was read. |

## Area: payments

(Same table for items that belong at area scope.)

## System: billing

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Payment retry scheduler | flow | Needs page | High | `areas/payments/systems/billing/containers/billing-api/flows/payment-retry.md` | [Billing API](/areas/payments/systems/billing/containers/billing-api/overview.md) | 2026-10-22 | Controls dunning; only its entry point was read. Start at `acme/billing-api: src/retry/`. |
| Ledger sync worker | container | Needs page | Medium | `areas/payments/systems/billing/containers/ledger-sync/overview.md` | [Billing](/areas/payments/systems/billing/overview.md) | 2026-10-22 | Referenced in deployment config; its repo has not been located. |

## Container: billing-api

(Same table for items that belong at container scope.)

## Domain: invoicing

(Same table for items that belong in a domain folder.)
```

The backlog lists only open work. When an entry is complete, delete its row (and its section if it was the last one). Do not keep a Done section or any record of completed items; the log records what was resolved.

Use one section per scope: Landscape, then `Area: <slug>`, `System: <slug>`, `Container: <slug>`, and `Domain: <slug>` sections for each scope with open items. Order sections by scope and then alphabetically. Create a section only when it has entries.

Field meanings:

- **Type:** system, container, component, domain, flow, concept, or entity (the page it would become). Use `question` for a specific factual unknown that does not map to a page.
- **Kind:** `Needs page` (deserves its own page), `Needs depth` (a page exists but is shallow), `Unknown` (could not be confirmed), or `Stale` (existing content that looks out of date, wrong, or ungrounded, noticed while working on something else and left unedited). A `Stale` entry names the page and section, what looks wrong, the evidence with a citation, and a proposed fix, and carries an anchor for the page tag to link to (see "Stale tags").
- **Priority:** High if it blocks understanding of a documented subject, Medium for significant but separable areas, Low for peripheral ones.
- **Proposed path:** where the page should live, chosen with the placement rules above, so whoever picks it up does not have to decide again.
- **Found while:** link to the page whose investigation surfaced it.
- **Added:** the date the entry was first added, as `YYYY-MM-DD` (the local date of the run, matching the log). Set it once when the entry is created and never change it, including when new context is merged into the entry later, so the age of an item stays visible.
- **Why / what is unknown:** enough that someone can pick it up cold, including the best starting file.

Deduplicate by item name within a scope. When the same item is found again, add the new context and raise priority if warranted, and keep the original Added date. If an item is later recognised as spanning a wider scope, move it to that scope's section and update its proposed path.

## Log

The log records what each run changed in the wiki. It is the OKF `log.md` at the wiki root, a flat list of date-grouped entries, **newest first**. The log describes changes to the wiki, not facts about the system, so it makes no claims that need citations and instead links to the pages that changed. It has no frontmatter.

```markdown
# Wiki Log

## 2026-10-23
* **Creation**: Added the [payment retry flow](/areas/payments/systems/billing/containers/billing-api/flows/payment-retry.md). Updated the billing hub.

## 2026-10-22
* **Update**: Flagged an outdated retry description in [payment-retry](/areas/payments/systems/billing/containers/billing-api/flows/payment-retry.md). Linked it to a new backlog item.
* **Creation**: Documented the [billing system](/areas/payments/systems/billing/overview.md) at overview depth. Added four follow-up items to the [backlog](/exploration-backlog.md).
* **Initialization**: Created the wiki.
```

Rules:

- **One entry is one logical change.** A single run usually produces one entry for the subject it documented, including the listing and link wiring, backlog additions, and tags that came with it. Make separate entries for changes that stand on their own, such as moving or regrouping pages, promoting a page to a wider scope, or tagging stale content found outside the subject. Do not make one entry per file.
- **Date headings** use ISO 8601 `YYYY-MM-DD`, the local date of the run. Add a new date heading at the top when the day has none. Otherwise add the new bullet at the top of that day's list.
- **Entry format:** `* **<Kind>**: <description>`. Kind is a leading bold word: `Initialization`, `Creation`, `Update`, `Move`, `Deprecation`, or `Stale`. The description is one to three plain sentences, each 3 to 15 words, saying what changed at a high level, with links to the pages created, updated, moved, or tagged. Mention backlog items added or resolved. When a run moves or renames a page, give the old and new paths.
- **Only add.** Never modify or remove earlier entries. Their links may stop resolving after a move and are not edited.
- When a wiki is first created, the first entry is an `Initialization` entry that says so.
- Skip the log only if the run changed nothing.

## Stale tags

When content outside the current subject looks stale, the page is marked with a `[stale]` tag and the backlog gets a matching `Stale` entry. The tag and the entry are linked both ways, so a reader of the page sees the warning and a reader of the backlog can find the content.

**Backlog side.** Put an HTML anchor with a unique id in the entry's Item cell, followed by the item name, and name the page and section in the "Why" cell:

```markdown
| <a id="stale-billing-retry-backoff"></a>Retry backoff description | concept | Stale | Medium | `areas/payments/systems/billing/containers/billing-api/flows/payment-retry.md` | [Cache](/areas/platform/systems/cache/overview.md) | 2026-10-23 | Section "Retries" says backoff is capped at 1 hour; [RetryPolicy.cs:12-31](https://github.com/acme/billing-api/blob/main/src/retry/RetryPolicy.cs#L12-L31) now caps it at 15 minutes. Proposed fix: update the sentence and its citation. |
```

The id is `stale-` plus a short slug of the page and topic, unique across the backlog. The Proposed path is the page that holds the stale content.

**Page side.** Insert a tag linking to the anchor, right after the affected statement:

```markdown
Retries use exponential backoff capped at one hour ([RetryPolicy.cs:12-31](...)). [[stale]](/exploration-backlog.md#stale-billing-retry-backoff)
```

Rules:

- The tag text is exactly `[stale]` (as a markdown link whose label is `[stale]`), so it can be found with a text search for `[stale]`.
- Place it after the statement and its citation, or after the heading, table row, or list item when the whole element is affected. If a whole section is affected, tag the section heading once.
- Do not alter any other text, citation, or structure on the page.
- If the content already has a tag, do not add another. Add the new evidence to the existing backlog entry.
- Remove the tag, and delete the backlog entry, when the content is corrected or confirmed current.
- Pages with unresolved tags can be found by searching the wiki for `[stale]`. The backlog is the authoritative list.

## Page front matter

Every concept page starts with OKF frontmatter. The OKF fields carry type, description, provenance, trust, and lifecycle. The extension fields carry scope, systems, locations, depth, and revision.

```yaml
---
type: Flow                     # OKF type. See the type values below.
title: Payment Retry
description: How a failed payment is retried with backoff until it succeeds or is abandoned.
tags: [billing, payments]
resource: https://github.com/acme/billing-api/tree/main/src/retry   # system, container, and component pages: web URL of the main code folder
status: draft                  # draft | stable | deprecated
generated: { by: architecture-wiki/claude-sonnet-5-5, at: 2026-10-22T14:00:00Z }
verified: { by: human:jdoe, at: 2026-10-25T09:00:00Z }   # only after a human confirmed the page
sources:                       # index of the main sources; inline citations stay in the body
  - id: retry-policy
    resource: https://github.com/acme/billing-api/blob/main/src/retry/RetryPolicy.cs
    title: RetryPolicy.cs
# Extensions for this wiki
scope: container:billing-api   # landscape | area:<slug> | system:<slug> | container:<slug> | domain:<slug>
systems: [billing, notifications]   # required for area and landscape pages; systems involved
locations:                     # required for system, container, and component pages
  - repo: acme/billing-api
    paths: [src/retry/, src/scheduler/RetryJob.cs]
depth: overview                # overview | standard | deep
sources_commit: 502b3be        # for multi-repo pages, use sources_commits: {repo: sha}
---
```

Field rules:

- **`type`** (required): a short descriptive string. Use `System`, `Container`, `Component`, `Flow`, `Entity`, `Concept`, `Domain`, `Area`, `Landscape`, `Rules`, `Glossary`, `Catalog`, or `Backlog`. Domain and area `overview.md` pages use `Domain` and `Area`.
- **`title`** and **`description`**: always set both. The description is one self-contained sentence and is repeated in the page's `index.md` entry.
- **`tags`**, **`resource`**: optional. `resource` is the web URL of the main code folder or file for system, container, and component pages, and is absent for abstract concepts.
- **`status`:** `draft` until a human reviews the page, then `stable`. Use `deprecated` for a page kept for links and history. Setting `stable` after human review also requires a `verified` entry with a `human:<id>` actor. Never write a `human:` actor for something a person did not do.
- **`generated`:** who wrote the current content and when. `by` is `architecture-wiki/<model id>` for agent output, or `human:<id>` for hand edits. `at` is the time of the last meaningful content change. Update both whenever you change the page body.
- **`verified`:** a list of `{ by, at }` events. Omit it unless someone actually confirmed the content against its sources.
- **`sources`:** an entry per main source, each with a `resource` (the source-control URL, following [citations.md](citations.md)) and optionally an `id` and `title`. It is an index for readers and tools. It does not replace the inline citations in the body.
- **`stale_after`:** optional ISO 8601 instant. Set it only when the page describes something with a known expiry.
- **`depth`** records how thoroughly the page's own subject is covered, so a later run can see what to extend.

## Code locations

A large system can span many repositories, so every system, container, and component page records where its code lives, both in the `locations` front matter and in a Code location section in the page body. Rules:

- **Name the repo** the way the team refers to it (for example `owner/name`, or the remote URL if there is no short name). Take it from the git remote (`git remote get-url origin`) or the workspace configuration, and say so on the page if you could not confirm it.
- **Give paths relative to the repo root**, as folders or files. List every repo and path that holds part of the subject, including infrastructure, deployment, schema, and configuration repos.
- **Nest consistently:** a container's locations are within its system's, and a component's within its container's. A system page lists the repos for the whole system; a container page narrows to the paths that implement it; a component page names the specific folders or files.
- **Mark overlaps:** if a path is shared by several containers or systems, say so on each page.
- **Flag unknowns:** if part of a system lives in a repo you have not seen, name it as best you can and add a backlog item.
- **Index them:** the system catalog in `areas/catalog.md` lists each system's repos.

Flows, entities, and concepts do not need `locations`; they cite their code in `sources` and inline.

## Links

Use bundle-relative links rooted at the repository root for links between wiki pages, for example `/wiki/flows/token-refresh.md`. Link a folder with its trailing slash only from an `index.md` listing. Never use a relative link to a file outside the repo that contains the wiki. Link to code in any other repo with its source-control web URL, as described in [citations.md](citations.md). After moving or renaming any page, search the wiki for links to the old path and fix them in the same run.
