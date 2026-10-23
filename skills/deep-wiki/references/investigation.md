# Investigation tactics

Prefer semantic tools (LSP go-to-definition, find-references, call hierarchy, type hierarchy) when the host offers them. They resolve overloads and shadowing that text search cannot. Fall back to text search and confirm each hit by reading it.

## Finding the definition

Search for declaration patterns, then open the best hit.

| Language | Patterns to try |
| --- | --- |
| TypeScript / JavaScript | `class X`, `interface X`, `type X =`, `enum X`, `function X`, `const X =`, `export { X }`, `X(` inside classes |
| C# | `class X`, `interface X`, `record X`, `struct X`, `enum X`, `namespace X`, `<type> X(` for methods |
| Python | `class X`, `def X`, `X =` at module level, `__all__` |
| Java / Kotlin | `class X`, `interface X`, `fun X`, `val X`, `var X` |
| Go | `type X`, `func X`, `func (r *T) X`, `var X`, `const X` |
| Rust | `struct X`, `enum X`, `trait X`, `fn X`, `impl ... X`, `mod X` |

For a qualified name, resolve the container first, then the member. For a file or directory target, list it and read the index or entry file first.

## Finding usages

1. Search for the exact identifier with word boundaries. Exclude `node_modules`, `bin`, `obj`, `dist`, `build`, `vendor`, and other generated or vendored output.
2. Drop hits that are comments, strings, or unrelated symbols with the same name. Check imports and namespaces to confirm each is the same symbol.
3. Handle indirection: re-exports and barrel files, aliases (`import { X as Y }`), interface calls that dispatch to implementers, dependency-injection registrations, reflection or string-based lookups, decorators and attributes, and configuration files that name the symbol.
4. For overloaded or common names, filter by arguments, receiver type, or file path.
5. Group the usages by purpose rather than listing every hit. Cite representative ones and give the count.

## Reading efficiently

- Read the whole definition, but for large files read around the relevant ranges and the file header (imports, top-level declarations).
- Read tests early. A test named after the behaviour is a better explanation than a comment.
- Skip generated code (`*.g.cs`, `*.designer.*`, `*.pb.*`, bundles). Note that it is generated and describe its source instead.
- For very large targets, survey signatures first, pick the load-bearing paths, and tell the reader what was summarised without a full read.

## History and rationale

- `git log -L <start>,<end>:<file>` shows how specific lines evolved. `git blame -L` gives the commit behind a line.
- Use commit messages and linked issues only to explain why something exists. Do not pad the page with history.
- If the history is unavailable or unhelpful, leave the rationale out or mark it as inferred.

## Verifying before you finish

- Re-open every file you cite and confirm the line numbers still point at what you describe.
- Confirm signatures by copying them from the source, not from memory.
- Check that each symbol named in a diagram exists.
