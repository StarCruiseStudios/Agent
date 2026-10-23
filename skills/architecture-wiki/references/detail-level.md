# Level of detail and durability

Write each page at the level of detail that suits its topic, and no lower. Detail that is finer than the topic needs goes stale as soon as the code changes, makes the page expensive to maintain, and buries the stable idea the reader came for. A high-level page should stay true through ordinary change: a new tool is added, a file is renamed, a commit lands. Volatile facts belong on the lowest page that needs them, stated once, with a citation.

## The durability test

Before keeping a sentence, ask: **would this become false if an item were added or removed, a file were renamed or moved, a version were bumped, or a new commit landed?** If yes, and the page is not the lowest level that needs that fact, do one of these:

1. Restate it at the level the page works at (a role or a property instead of an inventory or a value).
2. Replace it with a link to the page, hub, or source folder that owns the detail.
3. Remove it, and move the fact to a lower-level page or the backlog if it matters.

## Altitude rules

| Page | State | Do not state |
| --- | --- | --- |
| Landscape, area | Purpose, the kinds of systems and how they relate, boundaries, major cross-cutting flows and rules, how to navigate | Lists or counts of systems, containers, tools, or features; technology versions; file names; line numbers |
| System | Purpose, responsibilities and boundary, the roles its containers play and how they interact, external dependencies by role, key decisions | Complete inventories of containers or flows in prose (use the Pages section and the catalog), versions, counts, file lists, line numbers |
| Container | Role, technology, interfaces by purpose, runtime shape, how its components fit together | Every endpoint, command, or class; version numbers unless they are the point; line numbers |
| Component, flow, entity | Specific behaviour, steps, fields, rules, and configuration, because the page exists to hold them | Anything about neighbouring subjects beyond a short summary |

Only the bottom row is the right place for exact names, values, steps, and line anchors.

## Specific rules

- **Describe roles and categories, not inventories.** Write "an MCP server that exposes the repository's tools to agents" rather than listing each tool. Write "a set of reusable agent skills" rather than naming each skill. Name an item in a high-level page only when the page's point is that item.
- **Link instead of enumerating.** When a reader needs the full set, send them to the hub or catalog that is maintained for that purpose (`areas/catalog.md`, a scope's `index.md`) or to the source folder. Listings and catalogs are navigation that the skill updates on every run, so they may list items. Prose summaries may not rely on a list staying complete.
- **No counts, versions, or dates in prose** on high-level pages ("three tools", "version 2.1", "as of last month"). If a number matters, put it on the page that owns it with a citation. The `depth`, `sources_commit`, and `generated.at` front matter carry the revision information, so do not repeat commit identifiers in the body.
- **Do not describe the wiki's own mechanics in its content.** How citations work, which branch links point to, and which commit was reviewed are skill rules and page metadata, not architecture. Keep them out of the index and page prose.
- **Line anchors and exact lines belong on the lowest-level pages.** A high-level page cites the file or folder that establishes a claim. Line anchors follow the rules in [citations.md](citations.md).
- **Prefer stable properties.** State what is unlikely to change (purpose, responsibility, relationships, constraints, reasons) over what changes often (membership, names of leaf items, settings, current limits).
- **Summaries must be derivable from the lower pages.** If a high-level statement is only true because of specifics, the specifics belong in a lower page and the high-level statement should be the conclusion drawn from them, cited to them.
- **Keep depth proportional.** A subject that needs a paragraph gets a paragraph. Do not pad a high-level page with detail you happen to know. Record the detail in the backlog as a page to write, or keep it out.

## Example

Too detailed for a landscape or system overview:

> This wiki describes the architecture of the Agent repository. It contains an MCP server named Compass, a package that builds a Codex pet named Commander, and a folder of agent skills. Every claim links to the file and lines that support it, and line anchors refer to commit 502b3be.

Problems: it lists current contents, which goes stale when a tool is added or renamed; it describes the wiki's citation mechanics; and it embeds a commit identifier in prose.

At the right level:

> This wiki describes the architecture of the Agent repository, a collection of tools for working with AI coding agents. It covers the repository's runnable tools and its reusable agent skills. See the [systems catalog](/areas/catalog.md) for the current set.

It states the stable purpose and scope, and defers membership to the catalog, which the skill maintains.

## Applying it in a run

- Decide each page's altitude from its type and scope, then choose its content with the table above.
- While drafting, run the durability test on each sentence of a high-level page.
- When updating a page, check that existing content still passes the test. Content outside the subject that fails it is not edited; record it as `Stale` with the reason and tag it, per the stay-in-scope rules.
- In the final review, scan landscape, area, and system pages for inventories, counts, versions, commit identifiers, line anchors, and descriptions of wiki mechanics, and fix any in the pages you wrote.
