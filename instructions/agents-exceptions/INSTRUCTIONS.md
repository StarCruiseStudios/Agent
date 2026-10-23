# AGENTS exceptions

Only conventions that have a rule ID may have exceptions. An exception waives
only its named rule, at the scope (local, file, or directory) that the rule
declares. Any convention without a rule ID is mandatory and cannot be waived
with an exception comment or entry. An exception cannot waive any other
instruction.

A rule defines its ID by adding `[RULE-ID]` immediately under a heading, or
inline at the start of a paragraph, sentence, or bullet point; the rule is the
text that the tag introduces.

For local and file-scoped rules, write each exception as one `//` comment line
with this exact form:

```ts
// AGENTS-EXCEPTION[rule-id]: concrete reason
```

Replace `rule-id` with the ID of the rule being waived and `concrete reason`
with a specific explanation of why the rule does not fit this code. Use one comment
for each local or file-scoped rule being waived. Wildcard IDs, bare labels,
and reasons such as "not applicable" are not valid exceptions. The comment
applies only to the named rule and target, not to neighboring code.

- For a local declaration, constructor, field, import, or dependency use, place
  the comment immediately before the affected code. If a doc block precedes a
  declaration or field, place the exception immediately before that doc block.
  For an exception to the contents or format of a doc block, including a
  parameter comment, place it immediately before that block.
- For a file-scoped rule, place the comment at the top of the file, before
  imports and declarations.
- For a directory-scoped rule, add an entry to `AGENT_EXCEPTION.md` in that
  directory. List the entries as a bulleted list under an `# Exceptions`
  heading, with one entry per rule in the form `- rule-id: concrete reason`.
  Each entry applies only to the directory containing that file, not to nested
  directories. Do not place directory exceptions in source comments.
- An `AGENT_EXCEPTION.md` file may also have a `## Notes` section for human
  readers. Agents ignore it. Include it only when an exception needs further
  justification, explanation, or comments; otherwise omit it.

Examples of local and file exceptions, followed by the contents of a
directory's `AGENT_EXCEPTION.md` (the rule IDs shown are illustrative):

```ts
// AGENTS-EXCEPTION[DESIGN-TOP-LEVEL-FUNCTION]: This entry point must export the callback shape required by the host.
/**
 * Creates the callback expected by the host.
 */
export function createEntryPoint(): void { /* … */ }
```

```ts
// AGENTS-EXCEPTION[FILE-ONE-EXPORT]: The host loads both named handlers from this one module.
/**
 * Handles the host's start event.
 */
export class StartHandler { /* … */ }
/**
 * Handles the host's stop event.
 */
export class StopHandler { /* … */ }
```

```md
# Exceptions
- DOCMD-REQUIRED: This generated directory is recreated on each build and has no maintained source documentation.

## Notes
The notes section is intended for human readable documentation and should be ignored by the agent. It is optional, omit it if there is no further justification, explanation, or comments to make on this exception.
```

Add the appropriate comment or `AGENT_EXCEPTION.md` entry when introducing or
modifying code that deviates from a waivable rule. Existing code that is not
being changed needs no retroactive annotation. Reviewers should check that the
reason supports the specific exception and its scope. These exceptions are
instructions for agents and reviewers; there is no automated checker.