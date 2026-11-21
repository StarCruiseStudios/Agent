---
name: writing-doc-comments
description: Write or revise documentation comments so they state purpose, contract, and constraints without restating the implementation. Use when adding, editing, or reviewing doc comments, JSDoc, XML docs, docstrings, or API documentation on types, functions, fields, properties, and parameters.
metadata:
  version: "1.0"
---

# Writing Doc Comments

Write and revise documentation comments so a caller can use the API correctly without reading the implementation. Apply this whenever you add, edit, or review a doc comment, including comments a project convention requires.

When the project specifies comment syntax, which declarations need comments, or required tags, follow that shape. Use the guidelines below for what the sentences say. When the project is silent, use the host language's usual documentation-comment form, such as JSDoc, XML docs, docstrings, or `///` comments.

## When to write a comment

Write a comment when the name and type leave a caller unsure about purpose, contract, units, valid values, defaults, side effects, or failure behavior.

Skip a comment that would only restate the identifier or the type. When the project requires a comment on every declaration, still write one, and keep the sentence meaningful.

Revise a comment when you change the behavior it describes. Replace a comment that no longer matches the code.

## Guidelines for Quality Documentation Comments

1. Explain what and why, not how. Describe the purpose, behavior, and intent rather than repeating the implementation.
2. Document the contract. Clearly define inputs, outputs, side effects, exceptions, and important guarantees.
3. Be concise and specific. Use clear, direct language. Avoid unnecessary detail and vague descriptions.
4. Describe observable behavior. Focus on what callers can depend on, not internal implementation details.
5. Call out non-obvious constraints. Document assumptions, preconditions, edge cases, and limitations.
6. Avoid redundancy. Don't repeat information already obvious from names, types, or signatures.
7. Keep comments maintainable. Avoid implementation details likely to change during refactoring.
8. Use consistent terminology. Align with domain language and established documentation conventions.

Rule of thumb: A good documentation comment helps someone understand how to use an API correctly without reading its implementation.

## Guidelines for Fields, Properties, and Parameters

1. Describe meaning, not type. Explain what the value represents rather than restating its name or data type.
2. Document units and formats. Specify units of measurement, time zones, expected formats, and precision where relevant.
3. Clarify valid values. Explain acceptable ranges, constraints, special values, and whether null or empty values have distinct meanings.
4. Explain defaults. Document default values and what happens when a value is omitted or unspecified.
5. Describe behavior and semantics. For properties, clarify whether values are computed, mutable, cached, or have side effects when relevant.
6. Provide context. Explain how the value relates to the surrounding object or operation, especially when its meaning isn't obvious.
7. Avoid trivial comments. Don't write comments that merely repeat the identifier (e.g., // Gets or sets the name).
8. Keep descriptions concise. Prefer a single meaningful sentence unless additional details are necessary.

## How to apply the guidelines

1. Read the declaration and the behavior callers rely on before writing. Use tests and call sites when the contract is unclear.
2. Open with the purpose: what the declaration is for and the outcome it produces.
3. State the contract the signature does not already show: inputs, outputs, side effects, thrown or returned errors, and guarantees such as ordering, idempotence, or thread safety.
4. For each parameter, field, and property, state meaning, units or format, valid values, and defaults. Omit a note whose sentence would only repeat the name.
5. Name constraints, preconditions, and edge cases a caller would otherwise discover by reading the body.
6. Use the project's domain terms, and keep one term for one concept.
7. Leave out control flow, private helpers, and other details a refactor would invalidate.
8. Prefer one or two sentences. Add another sentence only for a constraint, unit, default, or failure mode the caller must know.

## Comment shape

Use the project's required form when it has one. Otherwise:

- Put the summary on the declaration, ahead of parameter and return notes.
- Document each parameter whose meaning, constraints, or default are not obvious from the signature, and every parameter when the project requires it.
- Document a non-void result: what it represents, and empty, null, or error results when those are distinct.
- Document thrown or returned failures when callers must handle them.
- Document fields and properties with the field guidelines. Say when a property is computed, mutable, cached, or has a side effect if that is part of the contract.

Match the surrounding file's comment syntax and tag names. Do not introduce a second documentation style in a file that already has one.

## Examples

**Purpose and contract.**

```ts
/**
 * Rejects the request when the caller is not allowed to read the invoice.
 *
 * @param invoiceId - Identifier of the invoice to load. Must be a non-empty string.
 * @returns The invoice visible to the caller.
 * @throws NotFoundError when no invoice exists with that identifier.
 * @throws ForbiddenError when the caller lacks read access.
 */
```

A comment that narrates the body fails the guidelines:

```ts
/**
 * Checks the auth service, then queries the database, then maps the row to an Invoice.
 */
```

**Field meaning, units, and valid values.**

```ts
/**
 * Amount charged for the invoice, in minor currency units (cents for USD).
 * Never negative. Zero means the invoice is complimentary.
 */
amountMinor: number;

/**
 * IANA time zone used to display due dates, such as "America/Denver".
 * When omitted, display uses UTC.
 */
timeZone?: string;
```

A comment that only repeats the identifier fails the guidelines:

```ts
/** Gets or sets the amount. */
amountMinor: number;
```

**A name that already states the meaning.** `createdAt: Date` needs a comment only when the instant means something other than when the record was created, such as the customer's local calendar date stored as UTC midnight. When the project still requires a comment, state that meaning in one sentence.

## Review before finishing

- A caller can use the API without reading the implementation.
- The comment states purpose and contract, and it leaves out the steps of the implementation.
- Parameters, fields, and properties state meaning, units, valid values, and defaults where those matter.
- No sentence only repeats the name or the type.
- The comment matches the code after the edit.
- Project-required tags and the project's comment form are present.
