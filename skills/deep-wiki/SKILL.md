---
name: deep-wiki
description: Generate an in-depth markdown wiki page for any code symbol (variable, field, function, method, class, interface, type, file, namespace, module, package). Use when the user asks to explain, document, deep-dive, trace, or "wiki" a symbol, file, or area of code and wants a durable, detailed write-up with sources, rather than a quick chat answer.
compatibility: Works with any agent that can read files and search code. Uses LSP or IDE symbol tools and git when available, and falls back to plain text search.
metadata:
  version: "1.0"
---

# Deep Wiki

Turn a code symbol into a detailed, accurate wiki page in the style of Devin/Windsurf DeepWiki. The target can be a variable, method, class, interface, type, file, namespace, module, or package. Produce the page itself as a markdown file, not advice about how to document it.

Every statement on the page must come from code you actually read. If you have not opened it, do not describe it.

## 1. Resolve the target

Accept any of: a bare name (`RetryPolicy`), a qualified name (`Billing.Invoices.Total`), a path (`src/server/auth.ts`), a `path:line` location, or a selection the user highlighted.

1. Search for the definition. Use LSP or IDE symbol lookup if available, otherwise search the repository (see [references/investigation.md](references/investigation.md)).
2. If several definitions match, choose the most plausible one from context (the open file, the user's wording) and state the choice in the page and in your reply. Ask the user only when the candidates are equally likely and differ in a way that changes the page.
3. Classify the target as one of: **value** (variable, field, constant, property), **callable** (function, method, constructor, handler), **type** (class, struct, interface, enum, trait, alias), **file**, or **container** (namespace, module, package, directory).
4. If the symbol does not exist, say so and suggest the closest matches. Do not invent a page.

## 2. Investigate before writing

Gather enough to explain the symbol without guessing. Work outward from the definition.

- **Definition:** read the whole definition and its immediate surroundings: doc comments, annotations or decorators, imports, enclosing type or module.
- **Usages:** find every reference. For values, separate readers from writers. For callables, find callers and what it calls. For types, find implementers, subclasses, instantiations, and consumers. For files and containers, find importers and the public surface.
- **Tests and docs:** read tests that exercise it, README or doc sections that mention it, and TODO or FIXME notes nearby. Tests are the best source of intended behaviour and examples.
- **History:** when the reason for a design is unclear, check `git log -L` or `git blame` for the relevant lines and cite the commit only if it explains something real.
- **Trace:** follow data and control flow one or two hops in each direction. Stop when further hops no longer change the reader's understanding.

Take notes as `path:line` pairs while you read. They become the Sources section.

When the target is large (a big file, a namespace), survey first, then read the parts that matter in depth. Say which parts you summarised from signatures only.

## 3. Write the page

Follow [references/page-template.md](references/page-template.md) for the section skeleton and the per-kind emphasis. In short, the page has:

1. Title, kind, and a one-paragraph summary of what it is and why it exists
2. Location and definition (file link, signature or declaration)
3. Purpose and responsibilities
4. How it works: a step-by-step walkthrough of the logic with short, relevant snippets
5. Contract: inputs, outputs, types, defaults, invariants, errors
6. Relationships: dependencies, callers and usages, inheritance and implementations, with a Mermaid diagram when a picture is clearer than prose
7. State, data flow, side effects, concurrency
8. Usage examples taken from real call sites or tests
9. Edge cases, gotchas, and design rationale
10. Related symbols and tests
11. Sources

Rules for the writing:

- **Explain, do not transcribe.** Say what the code means and why it is shaped this way. Do not restate it line by line.
- **Scale to the target.** A small constant gets a short page; a namespace gets a long one. Omit sections that do not apply instead of padding them.
- **Be concrete.** Name the real files, types, and functions. Quote short snippets (about 15 lines at most) with a language tag.
- **Separate fact from inference.** Anything not directly supported by the code gets labelled, for example "Inferred from the call sites in ...". Record open questions at the end instead of guessing.
- **Link to sources.** Use relative markdown links with line anchors, such as `[auth.ts:42](../../src/server/auth.ts#L42)`. Compute relative paths from the output file's location.
- **Diagrams must be valid.** Use Mermaid (`classDiagram`, `flowchart`, `sequenceDiagram`) only when it adds clarity, and keep nodes to real symbols.
- **Neutral, direct prose.** Plain sentences, present tense, no marketing language.

## 4. Save and report

- Write the page to `docs/wiki/<slug>.md`, where the slug is the lowercase, hyphenated qualified name (`billing-invoices-total.md`, `src-server-auth-ts.md`). Use another path if the user gives one. Create the directory if needed. If the file exists, update it in place instead of creating a duplicate.
- End the page with a line stating the commit (`git rev-parse --short HEAD`) and date it reflects, so readers can judge staleness.
- In your reply give the file path, a two or three sentence summary of what you found, and any assumptions or unresolved questions. Do not paste the whole page into chat.
- If the user asked about several symbols, write one page per symbol and link them to each other where they relate.

## 5. Review before delivering

Check the page against this list and fix problems before you reply:

- Every claim traces to code you read, and each Sources entry points to a real line.
- All links resolve from the page's location.
- Signatures, names, and defaults match the code exactly.
- The summary alone tells a newcomer what the symbol is for.
- Inferences are labelled, and nothing speculative is stated as fact.
- Depth matches the size and importance of the target.
