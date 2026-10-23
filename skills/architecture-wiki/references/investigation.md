# Investigation tactics

Prefer semantic tools (LSP definitions, references, call and type hierarchy) when available; otherwise search text and confirm each hit by reading it.

## Entry points by subject type

- **Container:** the runnable's entry point and host or startup code, its manifest or project file, its Dockerfile or deployment definition, its exposed endpoints, and its configuration.
- **Component:** the folder or module root, its public types and exports, and its tests.
- **System:** top-level README and docs, solution and package manifests, build and CI files, deployment and infrastructure definitions, the startup or host-builder code, dependency-injection registrations, public API surfaces, configuration files.
- **Domain:** names that recur across modules and systems, domain-layer folders, validation and business-rule code, tests named after business behaviour, existing glossary or product docs.
- **Flow:** the trigger (HTTP route, handler, message consumer, scheduler, UI event), then follow calls, queue publishes, and event handlers to the outcome. Tests and logs often reveal the real order.
- **Concept:** search for the pattern's key abstraction names, base classes, middleware, attributes, and shared utilities; list the places that use them.
- **Entity:** the type definition, schema or migration files, serializers and DTOs, repositories, and state-transition code.

## Finding the repos

1. Start with the repo you are in: `git remote get-url origin` and the repo root.
2. Check for other repos in the workspace (multi-root workspace files, sibling folders, submodules, `.gitmodules`).
3. Look for references to other repos or packages in build files, CI pipelines, deployment and infrastructure definitions, package manifests, and READMEs.
4. Record each repo with the paths that hold the subject. Where a referenced repo is not available to read, record its name and add a backlog item rather than describing code you have not seen.

## Mapping a large subject

1. Survey first: directory layout, manifests, and the public surface. Decide the main parts.
2. Read the load-bearing parts in depth (entry points, central abstractions, the main data path).
3. Skim the rest from signatures and file names. Record unread parts in the backlog.
4. State in the page which parts were read in depth and which were inferred from structure.

## Evidence, in order of trust

1. Code and configuration that is actually deployed
2. Tests
3. Schemas and migrations
4. Existing docs and comments (verify against code; note disagreements)
5. Git history (`git log`, `git blame`) for the reason behind a decision, cited only when it explains something real
6. Naming and structure (mark as inferred)

## Collecting citations while you read

- For each repo, note the web URL base from `git remote get-url origin` (converting SSH remotes to the web URL), its default branch (`git symbolic-ref refs/remotes/origin/HEAD`), and `git rev-parse HEAD` for the `sources_commit` of the checkout you read. These let you build branch URLs (see [citations.md](citations.md)).
- Record each fact with its `repo:path` and, when you will need a line anchor, the `startLine-endLine`, as you read it, not afterwards. Reconstructing citations from memory is how unsupported claims slip in.
- Cite the file by default. Note exact lines only for facts that need that specificity.
- If an absence claim matters ("nothing else calls this"), record the exact search you ran and where.

## Cross-checking

- Confirm each component named in a diagram exists in the code.
- Confirm a flow by tracing it end to end; do not describe steps you assumed.
- Skip generated and vendored code (`node_modules`, `bin`, `obj`, `dist`, `*.g.cs`, `*.pb.*`); mention that it exists and where it comes from.
- Re-open cited files before finishing to confirm they exist and that any line anchors point at the right lines.

## Updating an existing page

Compare the page's `sources_commit` with the current commit (`git rev-parse --short HEAD`). Diff the cited files (`git diff <old>..HEAD -- <paths>`) to find what changed, then revise only the affected sections and update `generated.at` and `sources_commit`.
