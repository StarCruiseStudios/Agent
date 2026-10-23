# Page template

Use this skeleton and drop any section that does not apply. Headings are fixed so pages stay consistent across a wiki.

````markdown
# <Symbol name>

> **Kind:** <class | interface | method | variable | file | namespace | ...>
> **Defined in:** [path/to/file.ext:LINE](relative/link#LINELINE)
> **Part of:** <enclosing type, module, or package>

<One paragraph: what it is, what problem it solves, and where it sits in the system.>

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

- [Other symbol](other-symbol.md): how it relates
- Tests: [path:LINE](link)

## Open questions

<Anything you could not confirm.>

## Sources

- [path:LINE](link): what is there

_Reflects commit `<short sha>` on <YYYY-MM-DD>._
````

## Emphasis by kind

**Value (variable, field, constant, property).** Declared type and initial value; lifecycle (when it is set, reset, and discarded); every writer and reader grouped by purpose; mutability and thread-safety; what breaks if its value changes. Keep it short unless it is central state.

**Callable (function, method, constructor).** Signature and contract; control-flow walkthrough including branches and early exits; error paths; side effects; callers (grouped) and callees; complexity or performance notes when they matter; a sequence or flow diagram for non-trivial logic.

**Type (class, struct, interface, enum, trait).** Role and invariants; member overview grouped by purpose (not alphabetically); construction and lifecycle; inheritance and implementations; collaborators; extension points; a class diagram. For interfaces, list implementers and what each does differently. For enums, explain each member's meaning and where it is switched on.

**File.** Role in its module; what it exports and what stays internal; main symbols with one-line descriptions linking to their own pages; imports and dependents; entry points and initialisation side effects.

**Container (namespace, module, package, directory).** Responsibility and boundary; public surface versus internals; sub-structure map; key flows that cross it; dependencies in and out; how to extend or test it. Link to child pages instead of repeating them.
