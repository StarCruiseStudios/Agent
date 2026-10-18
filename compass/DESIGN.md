# Compass

Compass is a local, read-only MCP server. It lists agent instruction packs in a project's `.compass` directory and returns one pack by name. An orchestrator can pick a pack and hand the name to a subagent, or the subagent can list and pick for itself. Both flows use the same two tools.

This document is the product and module contract for the first implementation. Do not add behavior that is not written here.

## Product behavior

### What an agent is

An agent, in Compass, is an instruction pack: a directory of human-authored text that tells a running agent how to behave. It is not a process, a host subagent type, or a skill install. The host still spawns the agent. Compass only supplies the catalog and the instructions.

### Names

The pack name is the subdirectory name under `.compass`. It is the only id callers pass around.

- Pattern: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`
- Length: 1 to 64 characters.
- The `name` field inside `agent.json` must equal the directory name.
- Names are case-sensitive identities. If two child directories compare equal under `toLowerCase()`, neither is loaded. That check happens before the name pattern, because a case-insensitive filesystem may open the wrong directory.
- A caller-supplied `name` is a single path segment. `/`, `\`, `.`, `..`, and empty strings are rejected before any filesystem join. A name that fails the pattern never reaches the disk.

### How the server finds the project

The server does not read environment variables to find the catalog, and it never searches parent directories. Every successful tool call requires an explicit absolute `projectRoot`. Resolution order:

1. If the tool call includes absolute `projectRoot`, use it.
2. When the caller omits it, return an error.

Rules:

- The server looks only at `<project root>/.compass`. It does not look in a parent of the project root, and a `.compass` nested under a child directory is not this catalog.
- `projectRoot` must be absolute. A relative value is `invalid_project_root`. The server does not resolve it against the cwd.
- `projectRoot` is trusted caller input. The user who launched the server can point it at any directory the process can read. The untrusted value is `name`, which must stay inside that project's `.compass`.

The catalog path is exactly `<project root>/.compass`. If that directory does not exist, the catalog is missing. Do not look anywhere else. A `.compass` directory in a parent or a child of the project root is not the catalog. There is one catalog per root. A monorepo caller passes the root it means.

### What list returns

`list_agents` returns every valid pack's summary and every invalid child directory as a problem. It does not return instruction bodies.

- Missing `<project root>/.compass`: success, `found: false`, `agents: []`, `problems: []`. That is the only missing-catalog result. A `.compass` directory somewhere else does not change it.
- `.compass` exists and has no child directories: success, `found: true`, empty `agents`.
- A valid pack appears in `agents`, sorted by `name` ascending.
- A child directory that is not a valid pack appears in `problems`, sorted by `name` ascending, and does not appear in `agents`.
- Loose files directly under `.compass` are ignored. They are not problems.
- Directory names that start with `.` are ignored.
- The response includes the resolved `projectRoot` and `compassPath` so the caller can see which catalog was used.

### What fetch returns

`fetch_agent_instructions` returns one pack. The agent fields match a list summary (`name`, `description`, `whenToUse`, `tools`, `modelHint`), and the payload also includes `projectRoot`, `compassPath`, `agentPath`, and `instructions`. `agentPath` is the absolute real path of that pack's directory, not of `instructions.md`. The caller treats `instructions` as the operating text for that agent.

Fetch reads the directory again. There is no cache. A pack edited on disk is visible on the next call.

### Errors

Handlers return a tool error. They do not throw out of the MCP session. The text content and `structuredContent` are both:

```json
{ "error": "<code>", "message": "<one sentence>" }
```

`isError` is true. Codes:

| Code | When |
| --- | --- |
| `invalid_project_root` | The chosen root is missing, not absolute, or not a directory. |
| `invalid_name` | `name` fails the pattern or is not a single segment. |
| `path_escape` | The real path of the pack is outside the real path of `.compass`. Includes a symlink that leaves the catalog. |
| `catalog_missing` | Fetch only. `<project root>/.compass` does not exist. The server does not search elsewhere. |
| `unknown_agent` | The name is valid, `.compass` exists, and that subdirectory does not. |
| `malformed_pack` | The directory exists but is not a valid pack. `message` includes the reason token below. |
| `case_collision` | Another child directory case-folds to this valid name. List reports every directory in that group under `problems`. Fetch returns this code and does not read the pack. |

Catalog order for each child directory, stopping at the first failure:

1. `case_collision` when more than one child case-folds to the same name.
2. `invalid_name` when the directory name fails the pattern.
3. `path_escape` when `realpath` leaves `.compass`.
4. Otherwise parse the pack. A parse failure is `malformed_pack:<token>`.

List sets `problems[].reason` to that result. Fetch of a caller `name` that fails the pattern returns `invalid_name` and does not read the catalog. Fetch of a valid name uses the same order and returns `code` `case_collision`, `path_escape`, `unknown_agent`, or `malformed_pack`. For `malformed_pack`, `message` includes the token. No error returns a partial body.

Parse tokens, in order:

| Token | When |
| --- | --- |
| `unreadable` | The directory or a required file cannot be read, or a symlink target is missing. |
| `missing_metadata` | `agent.json` is absent. |
| `invalid_encoding` | The file about to be parsed is not valid UTF-8. A leading UTF-8 BOM is stripped, then accepted. |
| `invalid_metadata` | `agent.json` is not a JSON object, fails the schema, or has unknown keys. |
| `name_mismatch` | `agent.json` `name` does not equal the directory name. |
| `missing_instructions` | `instructions.md` is absent. |
| `instructions_too_large` | `instructions.md` is larger than 262144 bytes. Size is the byte length, checked before decoding. |
| `empty_instructions` | After decoding, `instructions.md` is empty or whitespace. |

`invalid_encoding` applies to `agent.json` before `invalid_metadata`, and to `instructions.md` after `instructions_too_large`. It is not a separate pass over both files.

Path check: find the child with `readdir` and a case-sensitive name match, then `realpath` `.compass` and that child. `path.relative(compassReal, packReal)` must not be absolute, must not be empty, must not start with `..`, and must not contain an extra segment. Use `path.relative` rather than a string prefix, so Windows paths stay correct. Do not open a path built only with `path.join`: on Windows that would open a different-case directory. A different-case dirent is not a match. It is `unknown_agent` when it is the only case-fold, and `case_collision` when it is one of several.

On fetch success, `agentPath` is `packReal`: the absolute real path of the pack directory. A symlink that stays inside the real `.compass` directory is accepted, and `agentPath` is the target's real path. A symlink that leaves `.compass` is `path_escape` and returns no `agentPath`.

List does not fail the whole call because one pack is bad. Valid packs are still returned.

### The two flows

Both flows call the same tools. Compass does not have an orchestrator mode.

1. Orchestrator picks, subagent pulls. The orchestrator calls `list_agents`. It uses `description` and `whenToUse` to choose the `name`, and `modelHint` to choose the model it passes when it spawns the subagent. It does not call fetch to learn the model. It tells the subagent the pack name. The subagent calls `fetch_agent_instructions` with that name and follows `instructions`.
2. Subagent picks and pulls. The running agent calls `list_agents`, chooses a name itself, then calls `fetch_agent_instructions`.

The subagent must call fetch even when the orchestrator already listed the catalog. The list payload is not the instructions.

## `.compass` directory convention

All catalog files are human-authored. Compass never writes the catalog, never generates an index, and never installs a pack into a host skill directory.

Required, per pack directory:

| File | Role |
| --- | --- |
| `agent.json` | Metadata. Strict JSON object, UTF-8, no comments. |
| `instructions.md` | The instruction body. UTF-8 Markdown. This is the whole body. |

`agent.json` fields:

| Field | Required | Constraint |
| --- | --- | --- |
| `name` | yes | Same pattern as the directory name, and equal to it. |
| `description` | yes | Non-empty string, 1 to 500 characters. What this pack is. |
| `whenToUse` | yes | Non-empty string, 1 to 500 characters. When a picker should choose it. |
| `tools` | no | Array of 0 to 32 unique strings. Each string is 1 to 64 characters. A hint about host tools the pack expects. Compass does not check that the host has them. Default when omitted: `[]`. |
| `modelHint` | yes | Non-empty string, 1 to 64 characters. The model a parent should request when it spawns a subagent for this pack. A free hint, not a closed model list. Tool output always includes it. It is never null and never omitted. |

Unknown `agent.json` keys are invalid. Extra files in a pack directory, including `notes.md` and `README.md`, are ignored and are not appended to the body. There is no include syntax and no inheritance from another pack.

Example:

```text
.compass/
  README.md                      # ignored human note
  orchestrator/
    agent.json
    instructions.md
  repo-reviewer/
    agent.json
    instructions.md
    notes.md                     # ignored
```

`orchestrator/agent.json`:

```json
{
  "name": "orchestrator",
  "description": "Dispatch work to background agents and keep the main thread free.",
  "whenToUse": "The user asks to orchestrate, or to run several independent tasks without blocking.",
  "tools": [],
  "modelHint": "grok"
}
```

`orchestrator/instructions.md` is the markdown the fetching agent should follow. The first milestone can use a one-line fixture body.

## MCP API

Server identity: name `compass`, version `0.1.0`. Transport is stdio only. The server registers tools and no resources, prompts, or write tools. A resource would be a second way to read the same bytes, and hosts disagree on whether the model sees resources.

Register both tools with `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, and `openWorldHint: false`.

Each result sets `structuredContent` and a single text content item to the same JSON object. Success uses the output object for that tool. Failure uses `{ "error", "message" }` from the error table.

### `list_agents`

List agent instruction packs in the project `.compass` directory. Returns `name`, `description`, `whenToUse`, and `modelHint` so a parent can pick a pack and a model, then spawn a subagent. Does not return instruction bodies or `agentPath`.

Input:

```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Explicit absolute project root; omission returns invalid_project_root. The catalog is <project root>/.compass and nowhere else."
    }
  },
  "additionalProperties": false
}
```

Output:

```json
{
  "projectRoot": "string",
  "compassPath": "string",
  "found": true,
  "agents": [
    {
      "name": "orchestrator",
      "description": "string",
      "whenToUse": "string",
      "tools": [],
      "modelHint": "grok"
    }
  ],
  "problems": [
    {
      "name": "Bad Pack",
      "path": "string",
      "reason": "invalid_name"
    }
  ]
}
```

`modelHint` is a non-empty string. `reason` is `invalid_name`, `case_collision`, `path_escape`, or `malformed_pack:<token>`.

### `fetch_agent_instructions`

Fetch one agent instruction pack by its directory name. Returns the metadata, the absolute pack directory `agentPath`, and the full instructions markdown.

Input:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Pack directory name under .compass."
    },
    "projectRoot": {
      "type": "string",
      "description": "Explicit absolute project root; omission returns invalid_project_root. Same rule as list_agents."
    }
  },
  "required": ["name"],
  "additionalProperties": false
}
```

Output:

```json
{
  "projectRoot": "string",
  "compassPath": "string",
  "name": "orchestrator",
  "description": "string",
  "whenToUse": "string",
  "tools": [],
  "modelHint": "grok",
  "agentPath": "E:/Source/Github/StarCruiseStudios/Agent/.compass/orchestrator",
  "instructions": "string"
}
```

## Host configuration

Build first (`npm run build` in `compass/`). Hosts launch the built file with Node. They do not launch `tsx`. The samples below use a placeholder absolute path; each machine substitutes its own. Compass does not edit these files.

The server reads no environment variable to find `.compass`, and it does not search parent directories. Every host passes absolute `projectRoot` on every tool call, regardless of the process cwd. Do not add an env block. The input schemas permit omission only so handlers can return the documented `invalid_project_root` tool error; omission never selects a default.

### Codex

User file: `~/.codex/config.toml` (`%USERPROFILE%\.codex\config.toml` on Windows). Project file: `.codex/config.toml`.

```toml
[mcp_servers.compass]
command = "node"
args = ["E:/Source/Github/StarCruiseStudios/Agent/compass/dist/main.js"]
cwd = "E:/Source/Github/StarCruiseStudios/Agent"
```

`cwd` may be the project root, but does not select the catalog. Pass explicit absolute `projectRoot` on every tool call. `command` plus `args` is the stdio launch. No URL and no remote executor.

### Cursor

Project file: `.cursor/mcp.json`. User file: `~/.cursor/mcp.json`.

Cursor's documented stdio fields do not include a working-directory key. Do not invent one, and do not put the project path in `env`. Configure the command only:

```json
{
  "mcpServers": {
    "compass": {
      "type": "stdio",
      "command": "node",
      "args": ["E:/Source/Github/StarCruiseStudios/Agent/compass/dist/main.js"]
    }
  }
}
```

Cursor still has no cwd field, so the caller passes absolute `projectRoot` on the tool call. Do not rely on a parent directory search.

### Claude

Claude Code project file: `.mcp.json` at the project root. User scope is `~/.claude.json`, added with `claude mcp add` so a hand edit does not wipe other projects. Claude Code starts a project server with the project as the working directory. The sample sets no env:

```json
{
  "mcpServers": {
    "compass": {
      "type": "stdio",
      "command": "node",
      "args": ["E:/Source/Github/StarCruiseStudios/Agent/compass/dist/main.js"]
    }
  }
}
```

Claude Desktop file: `%APPDATA%\Claude\claude_desktop_config.json` on Windows, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS. Desktop has no cwd field. Use the same command and args, with no env block. The caller passes absolute `projectRoot` on every tool call.

### Other stdio hosts

Any host that spawns a local command and speaks MCP over stdin and stdout can use this server without extra Compass code. That includes VS Code (`.vscode/mcp.json`), Gemini CLI, Windsurf, Cline, and Goose. Every caller passes absolute `projectRoot`, even when the host sets cwd. HTTP, SSE, and remote executors are not part of this server.

## Language, runtime, and libraries

Match `codex-commander` unless a launch requirement forces a difference.

| Choice | Package / setting | Why |
| --- | --- | --- |
| Language | TypeScript | Same as `codex-commander`. |
| Runtime | Node.js `>=22.18.0` | Same `engines` floor. |
| Module | `"type": "module"` | ESM, same as commander. |
| Compiler | `typescript` `^5.9.3` | Same devDependency. |
| Node types | `@types/node` `^24.7.0` | Same devDependency. |
| MCP SDK | `@modelcontextprotocol/server` `^2.3.1` | Current v2 server SDK (spec 2026-07-28). Stdio entry is `serveStdio` from `@modelcontextprotocol/server/stdio`. Do not use `@modelcontextprotocol/sdk` v1. |
| Validation | `zod` `^4.6.7` | SDK-aligned Zod 4. Import from `zod`. Schemas are the tool and `agent.json` contracts. |
| Logger | `tslog` `^5.2.0` | Current ESM line. Requires Node 22, which this package already requires. |
| Tests | `node:test` and `node:assert/strict` | Same runner as commander. No Vitest. |

Stdout is the MCP frame stream. The logger adapter writes only to `process.stderr`. No module calls `console.log`. Log the resolved root, the catalog path, the agent count, each fetch name, and error codes. Do not log instruction bodies.

`codex-commander` sets `noEmit` because its scripts run TypeScript in place. Compass is spawned by hosts as a Node program, so its `tsconfig.json` emits `src/` to `dist/`. Concrete compiler options: `target` ES2022, `module` and `moduleResolution` NodeNext, `strict`, `verbatimModuleSyntax`, `types: ["node"]`, `rootDir` `src`, `outDir` `dist`, `sourceMap` true. Do not set `allowImportingTsExtensions` or `noEmit`; those block the host entry. Include only `src/**/*.ts`. Tests are executed by Node's type stripping and are not part of the emit.

Scripts:

- `build`: `tsc -p tsconfig.json`
- `start`: `node dist/main.js`
- `test`: `node --test tests/**/*.test.ts`

Package name `compass`, private, no publish config.

### Package layout

Each file has one top-level export. Classes take dependencies through constructors. Constructors only assign them. Public classes, interfaces, and schema fields get multiline doc comments.

| Module | Responsibility |
| --- | --- |
| `src/main.ts` | Exports `CompassMain`. `start()` delegates to `CompassProcess`. The module calls `start()` only when it is the process entry (`node dist/main.js`). Importing it from tests must not serve stdio. |
| `src/composition/CompassProcess.ts` | Wires the logger, filesystem, resolver, catalog, and MCP server. Its `start()` is the only method that calls `serveStdio`. No catalog rules. |
| `src/server/CompassMcpServer.ts` | Builds `McpServer` and registers the two tools. |
| `src/tools/ListAgentsTool.ts` | Parses list input, calls the catalog, maps the outcome to a tool result. |
| `src/tools/FetchAgentInstructionsTool.ts` | Parses fetch input, loads one pack, maps the outcome to a tool result. |
| `src/tools/ListAgentsInput.ts` | Zod input for `list_agents`. |
| `src/tools/FetchAgentInstructionsInput.ts` | Zod input for `fetch_agent_instructions`. |
| `src/tools/ToolResultFactory.ts` | Builds the shared success and error tool result from a plain object. |
| `src/catalog/AgentCatalog.ts` | Lists a root and loads one pack by name. Applies case-collision handling. |
| `src/catalog/AgentPackParser.ts` | Reads one directory into a pack or a malformed reason. |
| `src/catalog/AgentMetadata.ts` | Zod schema and parsed metadata type for `agent.json`. |
| `src/catalog/AgentSummary.ts` | Summary type returned by list. |
| `src/catalog/AgentInstructions.ts` | Fetch payload type. |
| `src/catalog/CatalogProblem.ts` | Problem type and reason tokens. |
| `src/catalog/ProjectRootResolver.ts` | Resolves the project root from an explicit absolute argument. Omission is `invalid_project_root`. Does not search parent directories and reads no environment variables. |
| `src/catalog/CompassPathGuard.ts` | Name pattern and realpath containment. |
| `src/filesystem/FileSystem.ts` | Narrow filesystem interface used by the catalog. |
| `src/filesystem/NodeFileSystem.ts` | `node:fs` implementation of that interface. |
| `src/logging/DiagnosticLogger.ts` | Logger interface: debug, info, warn, error, with a message and optional fields. |
| `src/logging/TslogDiagnosticLogger.ts` | `tslog` adapter that writes only to stderr. |

Tests live in `tests/` and import those modules with `.ts` specifiers. Source modules also use `.ts` specifiers; `rewriteRelativeImportExtensions: true` emits `.js` specifiers for hosts without requiring `allowImportingTsExtensions`. Fixture catalogs live under `tests/fixtures/`. Tests cover root resolution (absolute argument, omitted argument returns `invalid_project_root`, a missing `<project root>/.compass` is a missing catalog even if a parent or child has one), list entries that include `description`, `whenToUse`, and `modelHint`, fetch success including absolute `agentPath`, and each error code above, including a symlink that leaves `.compass`.

## First milestone

The first implementation is done when:

- `compass/` builds with the scripts and dependencies above.
- `node dist/main.js` speaks MCP over stdio and exposes only `list_agents` and `fetch_agent_instructions`.
- A fixture `.compass` can be listed and fetched through both flows: a caller can select a name from the list result and pass that name to fetch.
- The error table, empty catalog, and malformed pack behavior match this document.
- `npm test` and `npm run build` succeed.
- Diagnostics appear on stderr and stdout stays a pure MCP stream.

## Out of scope

- Installing packs into Codex, Cursor, or Claude skill directories.
- Creating or editing host MCP config. Samples in this file are documentation.
- HTTP, SSE, WebSocket, or any remote transport.
- Tools that create, update, or delete packs.
- MCP resources and prompts.
- Include syntax, pack inheritance, templates, or concatenating extra markdown files.
- A file watcher or an in-memory cache.
- Authentication and multi-user access.
- Publishing to npm, or a `tsx` launch path.
- Choosing or spawning the host subagent. Compass returns text. The host runs the agent.
