# Grounding and citations

Every factual claim on a wiki page must be grounded in a concrete source truth and carry an inline citation linked to it. A claim without a citation is not allowed on the page. If you cannot cite it, do not state it as fact: label it as inference with its evidence, or move it to Open questions and the backlog.

## What is a claim

A claim is any statement a reader could check against the world. This includes:

- That something exists, or where it lives (a service, a folder, a class, a table, a queue, a repo).
- What something does, how it behaves, and in what order things happen.
- Names, types, fields, defaults, limits, versions, configuration values, and technologies used.
- Relationships: who calls whom, who depends on what, who owns what data, what publishes or consumes what.
- Rules and invariants, and where they are enforced.
- Deployment, scaling, and runtime facts.
- Reasons and history (why something was built a certain way).

Framing sentences that carry no fact (a heading, a transition, a pointer to another page) need no citation. Summaries of a page's own sections need none if every fact in those sections is cited there. Everything else does.

## What counts as source truth

Cite the strongest source that establishes the claim.

1. **Code and configuration** in the repos: source files, build and project files, dependency manifests, CI and deployment definitions, infrastructure as code, and checked-in configuration.
2. **Schemas and contracts:** migrations, database schemas, API specs, message and event definitions.
3. **Tests**, for intended behaviour and examples.
4. **Version control history:** a commit, pull request, or issue, for why something was built a certain way.
5. **Authored docs:** READMEs, architecture decision records, design documents, and code comments. Cite them as evidence of what the authors stated. When the claim is about current behaviour, confirm it against code and cite the code too; if they disagree, say so and cite both.
6. **External documentation** (a vendor or framework doc URL), for the behaviour of third-party technology.

Not acceptable as the only support for a fact:

- Another wiki page. It is derived content. Link to it for orientation, but cite the underlying source for the fact itself, and re-verify the source if you reuse the fact. Never copy a fact from another wiki page without checking it.
- Your memory, general knowledge of the technology, or a guess from naming or structure. These can motivate where you look, but only what you read counts.
- A statement from the user or a person that you did not verify. If you must include it, attribute it and mark it unverified, for example "Billing is described as owning dunning (stated by the team, not verified in code)". Add a backlog item to verify it.

## Inline citation format

Place the citation immediately after the claim it supports, at the end of the sentence or table cell. Use a short label and a link:

```markdown
Retries are scheduled with exponential backoff capped at one hour ([RetryPolicy.cs](https://github.com/acme/billing-api/blob/main/src/retry/RetryPolicy.cs)). The cap is read from configuration at startup ([Startup.cs:44-52](https://github.com/acme/billing-api/blob/main/src/Startup.cs#L44-L52)).
```

Rules:

- **Link targets point at source control, never at a relative path outside the wiki's repo.** A citation to a file in any repo other than the one that contains the wiki is always the web URL of that file in the repo's source control system (for example `https://github.com/StarCruiseStudios/Agent/blob/main/skills/architecture-wiki/SKILL.md`). Never use a relative link, a `../` path, or a local filesystem path to reach code in another repo, even when that repo is checked out next to the wiki. Links between wiki pages are bundle-relative paths that start with `/` (see [wiki-layout.md](wiki-layout.md)).
- **Build URLs from the git remote:** GitHub `https://github.com/<owner>/<repo>/blob/<branch>/<path>`, and the equivalent for the host in use (Azure DevOps, GitLab, Bitbucket). Convert SSH remotes to the web URL. If the web URL cannot be determined, use `repo:path` as plain text and add a backlog item, not a link you invented.
- **Prefer branch URLs over permalinks.** Use the repo's default branch (for example `blob/main/...`), found with `git symbolic-ref refs/remotes/origin/HEAD` or the host. Branch URLs stay current as the code moves. Use a commit permalink (`blob/<sha>/...`) only when the source is historical: a specific commit, pull request, or issue, code as it was at a particular version or point in time, or code that no longer exists on the branch. Say in the surrounding text that the reference is historical.
- **Link to specific lines only when specificity is required.** Link to the file (or folder) by default. Add a line anchor (`#L12-L31`) only when the claim depends on those exact lines and a reader would otherwise have to search the file for them, for example one branch of a long method, a particular configuration key, or a rule in a large file. Do not add line anchors for claims about a file's role, a type or class defined in a small file, or anything a reader sees at a glance. Line anchors on a branch URL can drift, so keep them to the minimum, and keep ranges tight (at most about 40 lines).
- **Label:** the file name, or `repo:path` when the repo is not obvious from context. Add `:lines` to the label only when the link has a line anchor. For a folder, use the folder path.
- **One claim, one source, one citation.** When several claims in a sentence come from different places, cite each at its own point. When several adjacent sentences rest on the same lines, one citation after the last is enough.
- **Multiple sources:** when a claim needs two sources (for example code and config), cite both.
- **Quotes and snippets:** a quoted snippet carries a citation with a line anchor on its exact lines, and must match the source.
- **Commit, PR, and issue citations:** these are historical sources. Link to the commit, PR, or issue URL and state what it shows.
- **Do not cite what you did not open.** Each citation must point at lines you read and that support the claim as written.

## Tables, lists, and diagrams

- **Tables:** include a Source column, or put a citation in each cell whose content is a claim. Every row is checked, not only the first.
- **Lists of claims:** cite each item.
- **Diagrams:** a diagram is a set of claims. Every node and every edge must be backed by a source. Directly below the diagram, add a "Diagram sources" list mapping each element (node, edge, or group of them) to its citation. Do not draw an element you cannot cite. An element that is inferred is drawn dashed and listed as inferred, with its evidence.
- **Code location tables:** each repo and path row links to that folder or file with a source-control branch URL (no line anchors).
- **Front matter** (`locations`, `systems`, `resource`, `sources`) must agree with the cited body content. The `sources` field indexes the main sources and never replaces inline citations.

## Inference, rationale, and unknowns

- **Inference:** you may draw a conclusion from several cited facts, but label it ("Inferred from ...") and cite the facts it rests on. Never present an inference in the same voice as a verified fact.
- **Rationale:** state why something is designed a certain way only when a source says so (a commit message, ADR, PR, comment, or doc), and cite it. Otherwise mark it inferred, or leave it out.
- **Absence claims** ("nothing else calls this", "there is no retry") are factual claims about a whole codebase. State the search you ran and its scope in the citation or sentence (for example "no other references in `acme/billing-api` at `502b3be`, found by searching for `RetryJob`"), and limit the claim to what you searched.
- **Unknowns:** things you could not establish go in Open questions and the backlog, not in the body.

## Neighbours and summaries

Facts you include about a neighbouring subject at summary depth need the same citations as anything else. A short summary is acceptable only if each of its facts is cited to the neighbour's source. If you do not have a source for a neighbour fact, drop the fact, or write only that the neighbour exists and add a backlog item.

## Verification pass

Do this before reporting:

1. Sweep each page you wrote or changed for sentences, table cells, list items, and diagram elements that state a fact without a citation. Add the citation, rewrite as labelled inference, or remove the claim.
2. For every citation, reopen the target in the checkout you read (the code at `sources_commit`) and check that the file, and any cited lines, exist and actually support the claim as worded. Fix mismatches in the claim, not by loosening the citation.
3. Check that links are correctly formed: no relative or local-path links to files outside the wiki's repo, branch URLs for current code, commit permalinks only for historical sources, line anchors only where specificity is needed, and repo, branch, and path matching the remote.
4. Check that no claim relies only on another wiki page, a user statement, or memory.
5. In your reply, state the number of claims you could not ground and moved to the backlog, if any.

When updating an existing page, apply the same standard to the text in the sections you are updating for the current subject. Uncited statements there that you cannot ground in this run are removed or marked as unverified, and the gap is listed in the backlog. For uncited or unsupported statements outside the subject, do not edit them: record them in the backlog as `Stale` with the evidence, as described under "Stay in scope" in SKILL.md.
