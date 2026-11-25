# Compass

A local, read-only MCP server for human-authored agent instruction packs. Requires Node.js 22.18.0 or newer. [DESIGN.md](DESIGN.md) is the full contract; this file is the user guide.

From this directory:

```sh
npm ci
npm run build
npm test
```

Build and link the package to expose the `compass` command:

```sh
npm run build
npm link
compass
```

The `prepare` hook also builds during linking when npm permits lifecycle scripts. Running the build explicitly works even when npm's script approval policy skips that hook. Newer npm versions may warn about the linked package's `prepare` script; `npm install-scripts approve` manages local dependencies and cannot approve Compass itself as a global link. After a successful explicit build and link, the command is ready to use.

## Configuring a host

When the host starts the server in the project directory (Claude Code does for project-scoped servers, and Codex does when its `cwd` setting points there), launch it with `--project-root .` so tool calls can omit `projectRoot`:

```json
{"mcpServers":{"compass":{"command":"compass","args":["--project-root","."]}}}
```

```toml
[mcp_servers.compass]
command = "compass"
args = ["--project-root", "."]
```

The launch value may be absolute or relative. A relative value resolves once, at startup, against the server's working directory. For hosts without a working-directory setting (Cursor, Claude Desktop), pass an absolute path, or omit the flag and pass an absolute `projectRoot` on every call. You can also launch `node` with the absolute path to `compass/dist/main.js`, or run `npm start`.

Launch flags, each accepted once as `--flag value` or `--flag=value`:

| Flag | Meaning |
| --- | --- |
| `--project-root <path>` | Default project root for calls that omit `projectRoot`. Validated at startup. |
| `--log-level <debug\|info\|warn\|error>` | Minimum level of the JSON diagnostics written to stderr. Default `info`. |

An invalid root exits with code 1. An unknown argument, a missing value, a repeated flag or an unknown log level exits with code 2. Either way the reason is printed to stderr. Stdout carries only MCP messages.

A per-call `projectRoot` must be absolute and always overrides the launch default. There is no working-directory default, environment override or parent-directory search.

## How agents use it

Compass discloses a pack progressively, and the server's MCP `instructions` describe the steps to the host:

1. `list_agents` returns the `name`, `description`, `whenToUse`, `modelHint` and `tools` of each pack, for choosing one. It never returns instructions.
2. `fetch_agent_instructions` returns the chosen pack's instructions plus the names and descriptions of its skills.
3. `fetch_skill_instructions` returns one skill's body, only when it is needed.
4. `fetch_resource_path` / `fetch_script_path` return the absolute path of a file that the instructions or a skill name.

```json
{"name":"list_agents","arguments":{}}
{"name":"fetch_agent_instructions","arguments":{"name":"orchestrator"}}
{"name":"fetch_skill_instructions","arguments":{"agentName":"orchestrator","skillName":"dispatch"}}
```

`fetch_agent_instructions` and `fetch_skill_instructions` return two text items. The first is the raw Markdown body. The second is JSON holding every other field. `structuredContent` holds all fields, including `instructions`. Every other result is one JSON text item that equals `structuredContent`. Every tool declares an `outputSchema`.

### Errors

Every failure is a tool error (`isError: true`) whose text and `structuredContent` are the same JSON object:

```json
{"error":"unknown_agent","message":"No agent named \"orchestrater\" exists in this catalog. Did you mean: orchestrator?","name":"orchestrater","suggestions":["orchestrator"]}
```

- Arguments that do not match a tool's input schema (missing or unknown fields, wrong types) return `invalid_input` with `issues: [{path, message}]`.
- `unknown_agent`, `unknown_skill`, `unknown_resource` and `unknown_script` echo the requested `name` and give at most three close `suggestions`. A whole directory is never listed.
- `invalid_name` suggests the obvious valid form when there is one, for example `Code Review` to `code-review`.
- `malformed_pack` and `malformed_skill` include the parse `reason`, the `name` and the `path`.

The other codes are `invalid_project_root`, `catalog_missing`, `catalog_unreadable`, `path_escape`, `case_collision` and `internal_error`.

## Writing packs

Create packs manually under `<projectRoot>/.compass/<name>/`, with a strict UTF-8 `agent.json` and a UTF-8 `instructions.md`:

```json
{
  "name": "orchestrator",
  "description": "Dispatch independent work to background agents.",
  "whenToUse": "The user requests orchestration.",
  "tools": [],
  "modelHint": "grok"
}
```

The rules:

- **Name:** must match its directory and use lowercase letters, digits and single separating hyphens, starting with a letter (1–64 characters).
- **`description` and `whenToUse`:** 1–500 characters each.
- **`modelHint`:** required, 1–500 characters.
- **`tools`:** optional, up to 32 unique strings.
- **Instructions:** must contain non-whitespace text and be at most 262144 bytes.
- **Extra files** are ignored.

Compass supplies instructions; the host chooses and spawns agents.

`list_agents` validates `agent.json` and checks that `instructions.md` exists and is within the size limit, but it does not read the body. An instructions file that is empty or is not valid UTF-8 is reported only when the pack is fetched.

The fixture project at `tests/fixtures/project` can be used as a project root for a smoke test.

### Skills

An agent may define skills in `<agent>/skills/<skill>/SKILL.md`:

```markdown
---
name: dispatch
description: Dispatch independent tasks.
metadata:
  author: team
---
Assign independent tasks to available workers and collect their results.
```

The rules:

- **Frontmatter:** must be YAML, with a `name` matching its skill directory and a nonblank string `description`. Additional fields are allowed.
- **Name:** skill names follow the same rules as agent names.
- **Body:** must contain non-whitespace text.
- **File:** must be valid UTF-8 and at most 262144 bytes, including frontmatter. A leading BOM is accepted.
- **Location:** skill directories and files must resolve within their owning agent.

`fetch_agent_instructions` returns `skills: [{name, description}]`, sorted by name, and `skillProblems: [{name, path, reason}]`. Invalid skills are reported individually without preventing the agent or its valid skills from being returned. A skill name is scoped to its agent. Fetching a skill checks its agent's metadata but does not read the agent's instruction body.

### Resources and scripts

An agent may ship named files in `<agent>/resources/<file>` and `<agent>/scripts/<file>`. Compass does not list or read them; the agent's instructions and skills name the files to use. Fetch a file's absolute path, then read or run it with the host's own tools:

```json
{"name":"fetch_resource_path","arguments":{"agentName":"orchestrator","resourceName":"template.md"}}
{"name":"fetch_script_path","arguments":{"agentName":"orchestrator","scriptName":"check.ps1"}}
```

The rules:

- **Names:** a single file name made of letters, digits, `.`, `_` and `-`, not starting with `.`, at most 128 characters. Subdirectories cannot be addressed.
- **Namespaces:** resources and scripts are separate.
- **Errors:** links that resolve outside the directory return `path_escape`, and case-folded duplicates return `case_collision`.

## Referenced Compass directories

Each Compass directory can optionally contain `config.json`:

```json
{
  "directories": ["../../shared/.compass", "~/.compass", "${COMPASS_SHARED}/.compass", "%USERPROFILE%/team/.compass"]
}
```

How entries are read:

- **What they point to:** entries point directly to Compass directories, not project roots.
- **Relative paths:** resolve against the canonical directory that contains the config.
- **Home and variables:** `~`, `$VAR`, `${VAR}` and `%VAR%` come from the server process environment and expand once. An unset or empty variable produces an `invalid_reference` problem for that entry.
- **Nesting:** referenced directories can contain their own configs.

How agents are resolved across catalogs:

- **Visit order:** Compass visits the project catalog first, then follows references depth first in config order.
- **First valid definition wins:** the first validly named definition of each agent wins, including all of its skills, resources and scripts. A directory with an invalid name never hides a valid definition elsewhere; it is reported as `invalid_name` in its own catalog. An invalid winning pack does not fall back to a later definition.
- **Cycles:** shared dependencies load once. A reference back to an active ancestor is reported as `catalog_cycle` with its `chain`.
- **Broken references:** invalid configs and unreadable references are reported while the other branches remain available.

Catalog-wide problems appear only in `list_agents` `problems`. Fetch results carry only the fetched agent's own `skillProblems`. Every request reads the graph again.
