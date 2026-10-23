---
name: architecture-wiki
description: Incrementally build and maintain an architectural markdown wiki, written as an Open Knowledge Format (OKF) bundle, for a complex system. Point it at a system, domain, flow, concept, or entity and it creates or updates the relevant wiki pages at the right level of depth, links related pages, and records anything that still needs exploration in a central backlog. Use when the user wants to document, map, or explain architecture, design, or how a part of a codebase works as durable wiki pages. For a deep dive on a single code symbol, use deep-wiki instead.
compatibility: Works with any agent that can read and write files and search code. Uses LSP or IDE symbol tools and git when available, and falls back to plain text search.
metadata:
  version: "1.0"
---

# Architecture Wiki

Grow an architectural wiki one subject at a time. The wiki is an [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundle: markdown concept files with YAML frontmatter (a required `type`), `/`-rooted links, reserved `index.md` listings, and a `log.md` change history. All page conventions are in [references/wiki-layout.md](references/wiki-layout.md). Each run takes a subject, writes or updates the pages that subject needs, and records what it deliberately left unexplored in a central backlog. Over many runs the wiki fills in without any single run having to document everything.

Every factual claim must be grounded in a concrete source truth you actually read (code, configuration, schemas, tests, version history, or authored docs) and carry an inline citation linked to it. A claim you cannot cite is not stated as fact: it is labelled inference with its evidence, or recorded as an open question. Follow [references/citations.md](references/citations.md) for what counts as source truth and how to cite. Produce the wiki files themselves, not advice about documenting.

## Core principles

1. **Grounded in source truth.** Every factual claim, table row, list item, and diagram element has an inline citation linked to the source that establishes it, using a source-control URL for any code outside the wiki's repo. Other wiki pages, memory, and guesses are not sources.
2. **Detail matches the altitude.** High-level pages state stable purpose, roles, and relationships, not inventories, counts, versions, file lists, line anchors, or commit identifiers, which go stale quickly. Volatile detail lives on the lowest page that needs it, stated once. See [references/detail-level.md](references/detail-level.md).
3. **Depth follows the subject.** A page captures its own subject at full depth and everything it touches at summary depth. Documenting a system explains its purpose, structure, main flows, key entities, and design decisions. It does not produce detailed pages for each of those entities or flows.
4. **Nothing relevant is lost.** Facts you learn about neighbouring subjects while investigating go into the current page at summary depth, so the knowledge is captured even though the neighbour has no page yet.
5. **Unexplored work is tracked in one place.** Anything that deserves its own page, or that you could not confirm, goes into `exploration-backlog.md`. Do not leave dead links to pages that do not exist.
6. **Updates beat duplicates.** Always check what the wiki already says before writing. Extend and correct existing pages rather than creating overlapping ones.
7. **Pages are navigable and OKF-conformant.** Pages are organised by scope (landscape, area, system), and each page lives at the narrowest scope that contains everything it describes. Every concept page has OKF frontmatter with a `type`, `title`, and `description`. Every page is listed in the `index.md` of its folder, reachable from the root `index.md`, and links to its related pages.

## Workflow

### 1. Locate the wiki

Find the wiki root in this order: a path the user gave, an existing wiki (look for `exploration-backlog.md` or a `wiki`/`docs` directory containing `index.md`; the repository-root `index.md` carries `okf_version`), then the default `docs/architecture/`. If none exists, create it using [references/wiki-layout.md](references/wiki-layout.md) (a repository-root `index.md` with `okf_version: "0.2"` if missing, and in the wiki an `index.md`, `overview.md`, `log.md`, the backlog, and listings and folders on demand). If you find an existing wiki that is not OKF-conformant (frontmatter without `type`, `index.md` files that hold concept content, a `changelog/` folder), migrate it in the same run as a separate log entry, following the layout reference, before adding new pages. The wiki is hierarchical: landscape, then areas, then systems, then containers (following C4), with components as pages inside a container. Each scope has an `overview.md` concept page and an `index.md` listing, and its own `flows/`, `entities/`, and `concepts/` folders for things shared at that scope. Domains have a separate structure.

Navigate top-down before investigating: read the root `index.md` and `overview.md`, `areas/catalog.md`, the `index.md` listings and `overview.md` pages of the relevant area and system, the relevant domain page if any, the relevant sections of `exploration-backlog.md`, and any page already covering the subject or its neighbours. Follow the existing grouping and conventions.

### 2. Resolve the subject and its type

Accept a name, path, or description. Classify it as one of:

| Type | Meaning |
| --- | --- |
| system | A deployable or logical subsystem with a boundary (service, app, library, pipeline) |
| container | A separately runnable or deployable unit inside a system (service, app, worker, job, CLI, database, queue) |
| component | A grouping of related code inside one container (module, subsystem, layer) with a clear responsibility |
| domain | A business or problem area that may span systems (billing, identity) |
| flow | A behaviour across components over time (request path, job lifecycle, data pipeline) |
| concept | An idea or pattern (caching strategy, tenancy model, error handling) |
| entity | A core data object or model and its lifecycle (Invoice, Session) |

If the subject could be several types, choose the one that fits the user's question and note the others as related pages or backlog items. If a matching page already exists, you are updating it. Say so.

Then decide the **scope** and location with the placement rules in [references/wiki-layout.md](references/wiki-layout.md): the narrowest scope containing everything the page describes. A page about one container goes in that container's folder, a page spanning containers goes in the system's folder, a page spanning systems in one area goes in the area's folder, and a page spanning areas goes at landscape level. Business concepts go under `domains/`. When a system-level subject turns out to involve other systems, document the part this system owns in its folder, put the wider part at the wider scope, and link them both ways. Move a page up a scope when it turns out to be used more widely.

### 3. Choose the depth

Pick the depth before investigating, using [references/depth-guide.md](references/depth-guide.md), and the level of detail for the page's altitude using [references/detail-level.md](references/detail-level.md). It defines what each type includes at primary depth and what is allowed at summary depth. Honour the user if they ask for shallower or deeper coverage.

### 4. Investigate

Work outward from the entry points of the subject. Read code, configuration, build and deployment files, schemas, existing docs, and tests. Follow [references/investigation.md](references/investigation.md) for tactics. A system may span several repositories. Identify which repos and paths hold the subject (git remotes, workspace configuration, build and deployment files that reference other repos), and record them for every system, container, and component page as described under "Code locations" in [references/wiki-layout.md](references/wiki-layout.md). Capture the commit SHA and web URL base of each repo up front (see citations), and keep notes as `repo:path:line` for every fact you intend to write, because each one will need a citation, and keep a running list of discoveries you will not cover fully, each with a one-line reason.

Stop investigating a branch once it no longer changes the reader's understanding of the subject. Send it to the backlog instead of chasing it.

### 5. Write or update pages

Use the templates in [references/page-templates.md](references/page-templates.md) for the subject's type. When updating an existing page, preserve accurate content that is grounded, and within the sections you are updating for this subject, re-verify citations against the current code (fixing links and line anchors that have drifted), ground or remove uncited content, and correct what is now wrong. Add the new material in the right section and refresh the front matter. Leave sections unrelated to the subject untouched, as described under "Stay in scope" below.

Link rules:

- Link to a page only if it exists, using bundle-relative links rooted at the repository root, such as `/wiki/flows/token-refresh.md`.
- Mention a subject without a page in plain text and add it to the backlog.
- When you write a page, also add links from existing pages that should reference it, and add the page to the `index.md` of its folder's scope.
- Write each fact once, at the scope that owns it, and reference it from narrower scopes instead of repeating it.
- If you notice content elsewhere that looks out of date or wrong, do not fix it. See "Stay in scope" below.

Stay in scope:

- **In scope** is the subject you were asked to document: its own page or pages, and the sections of existing pages that describe that subject. Correct stale or wrong content there.
- **Out of scope** is everything else: other pages, and sections of the subject's pages that describe other things. If you notice something there that looks out of date, wrong, uncited, or contradicted by what you just read, do not change its wording, even when the fix is obvious and small. Instead do two things:
  1. Add a backlog entry of kind `Stale` under the scope of that content, with the page and section, what looks wrong, the evidence (a citation to the source you read that contradicts it), and a proposed fix. If an entry for it already exists, add the new evidence to it.
  2. Mark the content on the page with a `[stale]` tag linked to that backlog entry, placed immediately after the affected statement (or table row, list item, or heading when the whole element is affected). Insert the tag only. Leave the surrounding text, citations, and structure as they were. Do not add a second tag if one is already there. See "Stale tags" in [references/wiki-layout.md](references/wiki-layout.md) for the format.
- **Allowed edits outside the subject** are mechanical wiring and `[stale]` tags only: adding links and `index.md` entries for pages you created or changed, updating the catalog and coverage columns, moving a page you promoted along with fixing its inbound links, and inserting `[stale]` tags.
- **Clearing a tag:** when you correct content in scope that carries a `[stale]` tag, remove the tag and delete its backlog entry.
- If you cannot tell whether content is in scope, treat it as out of scope and backlog it.
- Mention the stale items you recorded in your reply, so the user can decide when to address them.

Writing rules:

- Explain what things are, why they are shaped that way, and how they interact. Do not transcribe code.
- Apply the durability test from [references/detail-level.md](references/detail-level.md) to every sentence on a landscape, area, or system page: if a new item, a rename, or a new commit would make it false, restate it as a role or property, link to the page or hub that owns the detail, or move it down. Do not describe wiki mechanics (citation rules, branches, reviewed commits) in page prose.
- Cite every factual claim inline, immediately after it, with a link to the source in source control (branch URL, line anchors only when specificity is needed, never a relative link outside the wiki's repo; see [references/citations.md](references/citations.md)). Cite per row in tables and per element in diagrams. Do not write a claim you cannot cite.
- Name real components, files, and types. Quote snippets sparingly (15 lines at most), each with a citation.
- Use Mermaid diagrams when structure or sequence is clearer as a picture, and only with elements you can cite. List the sources for each diagram directly below it.
- Separate fact from inference. Mark inferred statements and cite the facts they rest on, and put unresolved questions in the page's Open questions section and the backlog.
- Plain, direct, present-tense prose. No marketing language.

### 6. Update the central files

- **`exploration-backlog.md`:** add each deferred concept, uncertainty, and out-of-scope stale item you noticed under the correct scope section (Landscape, `Area: <slug>`, `System: <slug>`, `Container: <slug>`, or `Domain: <slug>`), with a proposed path chosen by the placement rules. Use the entry format in [references/wiki-layout.md](references/wiki-layout.md). Delete any entry this run completed (the page was written, the question answered, the stale content fixed); do not keep completed items anywhere in the backlog. Stamp each new entry with the date it was added (`YYYY-MM-DD`, the local date of the run) in its Added column, and never change that date later. Keep entries deduplicated: if one exists, add the new context to it and keep its original Added date.
- **Listings:** add or refresh the entry for each page you created or changed in the nearest `index.md` (container, system, area, landscape, or domain), with the page's frontmatter `description`. For a new container, also add it to its system's `index.md`. For a new system, area, or domain, also add it to `areas/catalog.md` and `areas/index.md` or `domains/index.md`, and refresh the coverage column of any system you touched. If the subject has a business meaning, update the relevant domain page (capability map, rules, glossary), or backlog a domain page if none exists.
- **`log.md`:** after all other edits are done, add an entry for each logical change this run made, using the format in "Log" in [references/wiki-layout.md](references/wiki-layout.md): a bullet `* **<Kind>**: <1 to 3 short sentences with links>` at the top of today's `## YYYY-MM-DD` section (add the heading at the top of the file if the day has none). Never modify or remove earlier entries. Skip the log only if the run changed nothing.
- **`glossary.md`:** add new domain terms if the wiki has one, or if you introduced more than a few.

### 7. Review and report

Check before replying:

- Run the verification pass in [references/citations.md](references/citations.md): no uncited factual claim remains on any page you wrote or changed, every citation points at a source that supports its claim, links follow the URL rules, and none relies solely on another wiki page, a user statement, or memory.
- All links resolve from their page's location, and no link targets a missing page.
- The summary alone tells a newcomer what the subject is for.
- High-level pages pass the durability test: no inventories in prose, counts, versions, commit identifiers, line anchors, or descriptions of wiki mechanics, and the detail they defer is reachable by link.
- Depth matches the subject's type, and summary-depth neighbours were not expanded into mini-pages.
- Every page sits in the right place per the placement rules, is listed in the `index.md` of its folder, and has correct `scope` front matter.
- Every concept file has parseable YAML frontmatter with a non-empty `type`, a `title`, and a `description` that matches its `index.md` entry. `index.md` files hold only listings, with no frontmatter except `okf_version` at the root. `generated.at` and `sources_commit` are current on every page you changed, and no `verified` entry claims a human review that did not happen.
- Every system, container, and component page lists its repos and paths, nested within its parent's, and the paths exist.
- The backlog contains everything you deferred, under the right scope.
- `log.md` has a new bullet for each logical change, newest first, in the required format, and no earlier entry was altered.
- You edited nothing outside the subject except mechanical wiring and `[stale]` tags, and every out-of-scope problem you noticed is both in the backlog as `Stale` and tagged on its page, with the tag linking to the entry.

In your reply give: pages created and updated (as links), the log entries you added, a short summary of the findings, the backlog items you added (and their priority), any assumptions, and any claims you could not ground and therefore left out or labelled as inference. Do not paste the pages into chat. Suggest the two or three most valuable next subjects to explore.

## Related

Use the `deep-wiki` skill for a detailed page on one code symbol. An architecture page may link to those pages when they exist and should list a symbol in the backlog when it warrants one.
