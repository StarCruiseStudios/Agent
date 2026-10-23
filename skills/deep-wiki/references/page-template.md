# Page template

Each page is an OKF v0.2 concept: YAML frontmatter followed by a markdown body. Use this skeleton and drop any section that does not apply. Headings are fixed so pages stay consistent across a wiki.

## Frontmatter

`type` is the only required key. Set the others whenever you can.

```yaml
---
type: Class                  # the symbol kind: Class | Interface | Struct | Enum | Type | Method | Function | Constructor | Variable | Field | Constant | Property | File | Namespace | Module | Package | Directory
title: RetryPolicy           # the symbol name, qualified if that disambiguates
description: Decides how many times and how long to wait before a failed call is retried.   # one self-contained sentence; repeated in index.md
resource: https://github.com/acme/billing-api/blob/main/src/retry/RetryPolicy.cs   # web URL of the definition; repo-relative path if no web URL is known
tags: [retry, resilience]
status: draft                # draft | stable | deprecated
generated: { by: deep-wiki/claude-sonnet-5-5, at: 2026-10-22T14:00:00Z }
sources:                     # index of the main sources; inline links in the body remain the per-claim attribution
  - id: retry-policy
    resource: https://github.com/acme/billing-api/blob/main/src/retry/RetryPolicy.cs
    title: RetryPolicy.cs
# Extensions
defined_in: src/retry/RetryPolicy.cs:12
part_of: Billing.Retry
language: csharp
sources_commit: 502b3be
---
```

Rules:

- `generated.by` is `deep-wiki/<model id>`; `generated.at` is an ISO 8601 time with an explicit offset and is the last meaningful content change. Omit `verified` unless a person confirmed the page, and then use `human:<id>` as the actor.
- `description` must stand alone as a snippet and must match the page's `index.md` entry.
- Keep unknown extension keys. Never drop keys another tool added.

## Body

````markdown
# <Symbol name>

<One paragraph: what it is, what problem it solves, and where it sits in the system. Name the kind, the defining file as a link with a line anchor, and the enclosing type, module, or package.>

## Definition

```<lang>
<signature or declaration, exactly as in the code>
```

## Purpose and responsibilities

<What it is responsible for and, just as important, what it is not.>

## How it works

<Step-by-step walkthrough. Number the steps for sequential logic. Quote short snippets with links to their lines.>

## Contract

| Item | Type | Description |
| --- | --- | --- |
| ... | ... | ... |

<Defaults, invariants, preconditions, return values, thrown errors.>

## Relationships

- **Depends on:** ...
- **Used by:** ...
- **Extends / implements:** ...

```mermaid
<optional diagram>
```

## State and data flow

<Where its data comes from and goes, what it mutates, side effects, threading or async behaviour.>

## Usage

<Examples from real call sites or tests, with links.>

## Edge cases and gotchas

<Surprising behaviour, performance notes, known limits, error handling.>

## Design notes

<Why it is built this way, with evidence. Label inference.>

## Related

- [Other symbol](/docs/wiki/other-symbol.md): how it relates
- Tests: [path:LINE](link)

## Open questions

<Anything you could not confirm.>

````

## Emphasis by kind

**Value (variable, field, constant, property).** Declared type and initial value; lifecycle (when it is set, reset, and discarded); every writer and reader grouped by purpose; mutability and thread-safety; what breaks if its value changes. Keep it short unless it is central state.

**Callable (function, method, constructor).** Signature and contract; control-flow walkthrough including branches and early exits; error paths; side effects; callers (grouped) and callees; complexity or performance notes when they matter; a sequence or flow diagram for non-trivial logic.

**Type (class, struct, interface, enum, trait).** Role and invariants; member overview grouped by purpose (not alphabetically); construction and lifecycle; inheritance and implementations; collaborators; extension points; a class diagram. For interfaces, list implementers and what each does differently. For enums, explain each member's meaning and where it is switched on.

**File.** Role in its module; what it exports and what stays internal; main symbols with one-line descriptions linking to their own pages; imports and dependents; entry points and initialisation side effects.

**Container (namespace, module, package, directory).** Responsibility and boundary; public surface versus internals; sub-structure map; key flows that cross it; dependencies in and out; how to extend or test it. Link to child pages instead of repeating them.
