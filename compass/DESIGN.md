# Compass

Compass is a local, read-only MCP server. It serves human-authored agent instruction packs from a project's `.compass` directory and from Compass directories that it references, disclosing them progressively: summaries first, then one pack's instructions, then individual skills and file paths only on demand.

This document is the product and module contract. Behavior not written here is out of scope. The [README](README.md) is the user guide.

## Principles

- **Progressive disclosure.** Each call returns only what the next decision needs. A listing never contains instruction bodies, and a fetched agent never lists its resources or scripts. A failed lookup suggests at most three close names, never a full directory.
- **Explicit roots.** The project root is a per-call absolute `projectRoot` or the launch `--project-root`. There is no working-directory default, environment override or parent search.
- **Human-authored, read fresh.** Compass never writes, indexes, caches or installs a catalog. Every call reads the disk again.
- **Uniform failures.** Every failure, including malformed arguments, is a tool error with the same `{ error, message, ... }` shape.
- **The host runs agents.** Compass returns text and paths. It does not choose a model, spawn a subagent or run a script.

## Concepts

An **agent** (or pack) is a directory of human-authored text that tells a running agent how to behave. It is not a process, a host subagent type or a skill install.

A **skill** is a named, separately fetched instruction body that belongs to one agent.

A **resource** or **script** is a named file in an agent's `resources` or `scripts` directory. Compass only resolves its path.

### Names

Agent and skill names share one rule (`AgentName`):

- Pattern `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, 1 to 64 characters.
- The `name` inside `agent.json` (or a `SKILL.md` frontmatter) must equal the directory name.
- Names are case-sensitive identities. Directories that compare equal under `toLowerCase()` are a case collision, and none of them is loaded. The collision check precedes the pattern check, because a case-insensitive filesystem may open the wrong directory.
- A caller-supplied name is validated before any filesystem access. When an invalid name has an obvious valid form (trimmed, lowercased, spaces or underscores to hyphens), `invalid_name` suggests it.

Resource and script names are single file names: letters, digits, `.`, `_` and `-`, not starting with `.`, at most 128 characters.

## Project root

Resolution for every tool call:

1. If the call includes `projectRoot`, it must be an absolute path to an accessible directory; otherwise the result is `invalid_project_root`. An invalid explicit value never falls back to the default.
2. Otherwise, if the server was launched with `--project-root`, use that default. It is validated again on each use.
3. Otherwise, `invalid_project_root`.

The launch value may be relative. It is resolved once, at startup, against the server's working directory and validated there. The recommended configuration for hosts that start servers in the project directory is `--project-root .`.

The catalog is exactly `<project root>/.compass`. A `.compass` directory in a parent or a child of the root is not the catalog. `projectRoot` is trusted caller input; names are untrusted and must stay inside their containing directories.

## Catalog layout

```text
.compass/
  config.json                    # optional references to other Compass directories
  README.md                      # loose files are ignored
  orchestrator/
    agent.json                   # required metadata
    instructions.md              # required body
    notes.md                     # ignored
    skills/
      dispatch/
        SKILL.md                 # frontmatter + body
    resources/
      template.md                # path resolvable by name
    scripts/
      check.ps1                  # path resolvable by name
```

Child directories of a Compass directory are candidate agents. A link to a directory counts as a directory, and a broken link counts too, so that it surfaces as unreadable. Names starting with `.` and loose files are ignored.

### `agent.json`

A strict UTF-8 JSON object with no comments and no unknown keys. A leading BOM is accepted.

| Field | Required | Constraint |
| --- | --- | --- |
| `name` | yes | Name rule, equal to the directory name. |
| `description` | yes | 1 to 500 characters, not only whitespace. What the pack is. |
| `whenToUse` | yes | 1 to 500 characters, not only whitespace. When a picker should choose it. |
| `tools` | no | 0 to 32 unique strings of 1 to 64 characters. A hint about the host tools the pack expects. Defaults to `[]`. |
| `modelHint` | yes | 1 to 500 characters, not only whitespace. The model a parent should request when it spawns a subagent. A free-form hint, never null or omitted in output. |

### `instructions.md`

UTF-8 Markdown, at most 262144 bytes (checked before decoding), and not empty or whitespace-only after decoding. A leading BOM is removed. It is the whole body; there is no include syntax, inheritance or concatenation.

### Skills

`<agent>/skills/<skill>/SKILL.md` starts with YAML frontmatter between `---` lines, containing `name` (the name rule, equal to the directory) and a nonblank string `description`. Other frontmatter fields are allowed and ignored. The body is everything after the frontmatter and must not be empty or whitespace-only. The file must be valid UTF-8 and at most 262144 bytes, including the frontmatter. A leading BOM is accepted. The `skills` directory, each skill directory and each `SKILL.md` must resolve within their owner.

### Resources and scripts

`<agent>/resources/<file>` and `<agent>/scripts/<file>` are separate namespaces. Compass resolves a name to its real path and never reads, lists or runs the file. The directory must resolve within the agent and the file within the directory. A directory is not a file, so it resolves as unknown.

### Referenced Compass directories

`config.json` in any Compass directory is a strict object `{ "directories": string[] }` with nonblank entries. Each entry is a Compass directory, not a project root.

How an entry is resolved:

- Environment variables (`$VAR`, `${VAR}`, `%VAR%`) come from the server process and are expanded once. An unset or empty variable makes that entry `invalid_reference`.
- A leading `~` or `~/` (or `~\`) expands to the home directory.
- A relative result resolves against the canonical directory that contains the config.

Shell expressions and `~user` are not supported.

How the graph is walked:

- **Order:** depth first, project catalog first, then references in config order.
- **Identity:** directories are identified by canonical real path, case-folded on Windows. A directory already completed is skipped.
- **Cycles:** a reference back to an active ancestor is a `catalog_cycle` problem with the canonical `chain`, and that edge is skipped.
- **Broken references:** an unreadable or missing reference is `catalog_unreadable`. An invalid config is `invalid_config` and contributes no references.

## Resolution across catalogs

Only a validly named directory can claim an agent name. Walking the directories in visit order:

1. A case-fold group of more than one directory claims its folded name, unless it is already claimed. If it does, every member is reported as `case_collision`.
2. A single directory with an invalid name is reported as `invalid_name` in its own catalog and claims nothing. So `Orchestrator/` in the project never hides a valid `orchestrator` in a referenced catalog.
3. A single valid directory claims its name unless it is already claimed. A later definition of a claimed name is shadowed silently.

The claiming definition owns all of its skills, resources and scripts; nothing is merged across definitions. An invalid claimant does not fall back to a later definition.

Fetching a name uses the same rule. The first directory that holds that exact name, or a case-fold group for it, decides the result.

## Validation order

For each candidate agent directory, stopping at the first failure:

1. `case_collision`
2. `invalid_name`
3. `path_escape`: the real path is not an immediate child of the real Compass directory. Checked with `path.relative`, never a string prefix.
4. Pack parse, reported as `malformed_pack:<token>`, with tokens in this order:

| Token | When | Detected by list |
| --- | --- | --- |
| `unreadable` | The directory or a required file cannot be read, a link target is missing, or `instructions.md` is a directory. | yes |
| `missing_metadata` | `agent.json` is absent. | yes |
| `invalid_encoding` | `agent.json` is not valid UTF-8. | yes |
| `invalid_metadata` | `agent.json` is not a JSON object, fails the schema or has unknown keys. | yes |
| `name_mismatch` | `agent.json` `name` differs from the directory name. | yes |
| `missing_instructions` | `instructions.md` is absent. | yes |
| `instructions_too_large` | `instructions.md` is larger than 262144 bytes. | yes |
| `invalid_encoding` | `instructions.md` is not valid UTF-8. | fetch only |
| `empty_instructions` | `instructions.md` is empty or only whitespace. | fetch only |

`list_agents`, `fetch_skill_instructions` and the path tools perform the **summary** parse: every step through `instructions_too_large`, using the file size and never reading the body. `fetch_agent_instructions` performs the full parse.

Skills use the same order with `malformed_skill:<token>` and the tokens `unreadable`, `instructions_too_large`, `invalid_encoding`, `invalid_metadata`, `name_mismatch` and `empty_instructions`.

## MCP API

Server identity: name `compass`, version `0.2.0`. Transport is stdio only. The server registers five tools and no resources or prompts. All tools are annotated `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true` and `openWorldHint: false`.

The `initialize` result carries `instructions` that describe the progressive flow once. Tool descriptions state only what each tool does and do not prescribe when to call it.

### Input handling

Each tool advertises a strict JSON Schema (required fields, `additionalProperties: false`). The SDK is given a schema that advertises that JSON Schema but accepts any value, so Compass validates the arguments itself. Arguments that fail the schema return `invalid_input` instead of an SDK text error. Absent arguments are treated as `{}`.

Every tool accepts an optional `projectRoot`.

| Tool | Required input |
| --- | --- |
| `list_agents` | none |
| `fetch_agent_instructions` | `name` |
| `fetch_skill_instructions` | `agentName`, `skillName` |
| `fetch_resource_path` | `agentName`, `resourceName` |
| `fetch_script_path` | `agentName`, `scriptName` |

### Output

Every tool declares an `outputSchema` for its success shape.

- `fetch_agent_instructions` and `fetch_skill_instructions` return two text items: the raw Markdown body, then the JSON of every other field. `structuredContent` holds every field, including `instructions`, so hosts that read only structured content lose nothing.
- Every other success, and every error, is one text item holding the JSON of `structuredContent`.

`list_agents`:

```json
{
  "projectRoot": "string", "compassPath": "string", "found": true,
  "agents": [{ "name": "orchestrator", "description": "string", "whenToUse": "string", "tools": [], "modelHint": "grok" }],
  "problems": [{ "name": "Bad Pack", "path": "string", "reason": "invalid_name", "chain": ["optional, cycles only"] }]
}
```

- A missing `<project root>/.compass` is a success with `found: false`, empty `agents` and empty `problems`. An empty catalog is `found: true`.
- `agents` is sorted by name. `problems` lists graph problems first, then pack problems in visit order.
- A `reason` is one of `invalid_reference`, `invalid_config`, `catalog_unreadable`, `catalog_cycle`, `invalid_name`, `case_collision`, `path_escape` or `malformed_pack:<token>`.
- Catalog-wide problems appear only here.

`fetch_agent_instructions` returns these fields:

- The agent fields: `name`, `description`, `whenToUse`, `tools` and `modelHint`.
- `projectRoot`, plus `compassPath` (the directory that holds the winning definition).
- `agentPath` (the real path of the pack directory) and `instructions`.
- `skills: [{name, description}]`, sorted by name.
- `skillProblems: [{name, path, reason}]`, where `reason` is `malformed_skill:<token>`, `invalid_name`, `case_collision` or `path_escape`.

`fetch_skill_instructions` returns `projectRoot`, `compassPath`, `agentPath`, `agentName`, `name`, `description`, `skillPath` and `instructions` (the body after the frontmatter).

`fetch_resource_path` and `fetch_script_path` return `projectRoot`, `compassPath`, `agentPath`, `agentName`, `name` and `path` (the real absolute path).

### Errors

`isError` is true, and the text and `structuredContent` are `{ "error": "<code>", "message": "<sentence>", ...details }`.

| Code | When | Details |
| --- | --- | --- |
| `invalid_input` | The arguments fail the tool's input schema. | `issues: [{path, message}]` |
| `invalid_project_root` | The chosen root is not absolute, missing or not a directory, or no root is available. | |
| `invalid_name` | A caller name fails its rule. | `suggestions` when a normalized form is valid |
| `catalog_missing` | Fetch only: `<project root>/.compass` does not exist. | `path` |
| `catalog_unreadable` | `<project root>/.compass` exists but cannot be read as a directory. | `path` |
| `unknown_agent` | No directory claims the name. | `name`, `suggestions` |
| `unknown_skill` | The agent has no such skill. | `name`, `suggestions` |
| `unknown_resource` / `unknown_script` | The agent has no such file, or the name is a directory. | `name`, `suggestions` |
| `case_collision` | The name belongs to a case-fold group. | `name`, `path` |
| `path_escape` | A real path leaves its containing directory. | `name`, `path` for packs |
| `malformed_pack` | The winning definition fails to parse. | `reason`, `name`, `path` |
| `malformed_skill` | The skill fails to parse. | `reason`, `name`, `path` |
| `internal_error` | An unexpected exception. Its message is logged, not returned. | |

`suggestions` holds at most three valid names from the same scope, closest first by case-folded edit distance (at most `max(2, ⌊length/3⌋)`) or by containment for requests of at least three characters. Ties are broken by name. Names starting with `.` are never suggested.

## Flows

Both flows use the same tools. Compass has no orchestrator mode.

1. **Orchestrator picks, subagent pulls.** The orchestrator calls `list_agents`, chooses a `name` by `description` and `whenToUse`, and chooses a model from `modelHint`. It passes only the name to the subagent. The subagent calls `fetch_agent_instructions`, because a listing is not the instructions.
2. **Agent picks and pulls.** The running agent calls `list_agents`, chooses a name and fetches it.

Skills, resources and scripts are then fetched one at a time, only when the instructions or the work call for them.

## Diagnostics

Diagnostics go to stderr as one JSON object per line, filtered by `--log-level` (default `info`). Stdout is reserved for MCP frames, and no module writes to it.

| Level | Events |
| --- | --- |
| debug | Resolved root and catalog path. |
| info | Catalog listed (agent and problem counts), pack fetch requested (name). |
| warn | Invalid pack found while listing; tool call rejected with a Compass error code. |
| error | Unexpected exception, with message and stack. |

Instruction bodies are never logged.

## Launch

`compass [--project-root <path>] [--log-level <debug|info|warn|error>]`. Each flag is accepted once, as `--flag value` or `--flag=value`. Unknown arguments, missing values, repeated flags or an unknown level exit with code 2, and an invalid root exits with code 1. Both print to stderr before serving.

## Runtime and libraries

| Choice | Package / setting |
| --- | --- |
| Language | TypeScript `^5.9.3`, ESM (`"type": "module"`) |
| Runtime | Node.js `>=22.18.0` |
| MCP SDK | `@modelcontextprotocol/server` `^2.3.1`, stdio via `serveStdio` |
| Validation | `zod` `^4.6.7` |
| YAML | `yaml` `^2.9.1` for skill frontmatter |
| Logger | `tslog` `^5.2.0`, stderr transport only |
| Tests | `node:test` and `node:assert/strict`, run through Node type stripping |

`tsconfig.json` emits `src/` to `dist/` with `target` ES2022, `module` and `moduleResolution` NodeNext, `strict`, `verbatimModuleSyntax`, `rewriteRelativeImportExtensions` and source maps. Sources import with `.ts` specifiers. Scripts: `build` (`tsc -p tsconfig.json`), `prepare` (build), `start` (`node dist/main.js`) and `test` (`node --test tests/**/*.test.ts`). The package is private and exposes the `compass` bin.

## Module layout

Each file has one top-level export. Classes take dependencies through constructors, and constructors only assign them. Public classes, interfaces and schema fields get doc comments.

| Module | Responsibility |
| --- | --- |
| `src/main.ts` | `CompassMain`. Starts `CompassProcess` only when it is the process entry. |
| `src/composition/CompassProcess.ts` | Parses launch arguments, validates the default root, wires everything and is the only caller of `serveStdio`. |
| `src/composition/LaunchArguments.ts` | `--project-root` and `--log-level` parsing; `LaunchUsageError`. |
| `src/server/CompassMcpServer.ts` | Server identity, server `instructions`, and registration of the five tools with their input and output schemas. |
| `src/tools/CatalogTool.ts` | Base handler: own input validation (`invalid_input`), the advertised schema, and error containment. |
| `src/tools/*Tool.ts` | One subclass per tool, mapping validated input to a catalog call and a result. |
| `src/tools/*Input.ts`, `ProjectRootField.ts` | Zod input contracts. |
| `src/tools/ToolOutputs.ts` | Zod success-output contracts. |
| `src/tools/ToolResultFactory.ts` | JSON, document and error results; error logging levels. |
| `src/catalog/AgentCatalog.ts` | Listing, name claiming across catalogs, and agent, skill and file lookups. |
| `src/catalog/CatalogGraph.ts` | Reference graph walk, cycles and graph problems. |
| `src/catalog/AgentPackParser.ts` | Summary and full pack parsing in token order. |
| `src/catalog/SkillCatalog.ts` | Skill listing and loading. |
| `src/catalog/PackFileCatalog.ts` | Resource and script path resolution. |
| `src/catalog/AgentMetadata.ts`, `AgentSummary.ts`, `AgentInstructions.ts`, `CatalogProblem.ts` | Contracts and types. |
| `src/catalog/AgentName.ts` | The shared name rule and its normalization. |
| `src/catalog/NameMatching.ts` | Case folding, collision groups and bounded suggestions. |
| `src/catalog/PathContainment.ts` | Real-path containment checks. |
| `src/catalog/DirectoryScanner.ts` | Child-directory enumeration, including links. |
| `src/catalog/CompassPathGuard.ts` | Caller name validation and immediate-child resolution. |
| `src/catalog/CompassError.ts` | Error code, parse `reason` and structured `details`. |
| `src/catalog/ProjectRootResolver.ts` | Explicit root, else the validated launch default. |
| `src/catalog/resolveCompassReference.ts` | Expansion of config references. |
| `src/filesystem/*` | Narrow read-only filesystem interface and its `node:fs` implementation. |
| `src/logging/*` | Logger interface and the leveled stderr `tslog` adapter. |

Tests in `tests/` cover every rule above. They use temporary catalogs and injected filesystem failures to check validation order, containment, name claiming, suggestions, input handling, result formats, log filtering and the stdio entry.

## Out of scope

- Writing, generating, caching or watching catalogs, and tools that create, update or delete packs.
- Installing packs into host skill directories, or editing host MCP configuration.
- Listing resources or scripts, or reading or running them.
- Include syntax, pack inheritance, templates or concatenating Markdown files.
- MCP resources and prompts, and HTTP, SSE or other remote transports.
- Authentication and multi-user access.
- Publishing to npm, or a `tsx` launch path.
- Choosing a model or spawning a subagent.
