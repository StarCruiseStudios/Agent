# Compass

A local, read-only MCP server for human-authored agent instruction packs. Requires Node.js 22.18.0 or newer.

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

Configure an MCP host with `compass` as its command and no arguments, with npm's global binary directory on the host's `PATH`:

```json
{"mcpServers":{"compass":{"command":"compass","args":[]}}}
```

You can also launch `node` with the absolute path to `compass/dist/main.js` as its argument, or run `npm start`. Diagnostics go to stderr; stdout is reserved for MCP messages.

Every tool call must include an explicit absolute `projectRoot`. There is no cwd default, environment override, or parent-directory search.

```json
{"name":"list_agents","arguments":{"projectRoot":"E:/Source/Github/StarCruiseStudios/Agent"}}
```

Select a name from the list, then fetch its instructions:

```json
{"name":"fetch_agent_instructions","arguments":{"projectRoot":"E:/Source/Github/StarCruiseStudios/Agent","name":"orchestrator"}}
```

Create packs manually under `<projectRoot>/.compass/<name>/`, with strict UTF-8 `agent.json` and UTF-8 `instructions.md` files. For example:

```json
{
  "name": "orchestrator",
  "description": "Dispatch independent work to background agents.",
  "whenToUse": "The user requests orchestration.",
  "tools": [],
  "modelHint": "grok"
}
```

The name must match its directory and use lowercase letters, digits, and single separating hyphens, starting with a letter (1–64 characters). Instructions must contain non-whitespace text and occupy at most 262144 bytes. Extra files are ignored. Compass supplies instructions; the host chooses and spawns agents.

The fixture project at `tests/fixtures/project` can be used as `projectRoot` for a smoke test. Tests compile the server before exercising its stdio entry and use temporary catalogs plus injected filesystem failures to verify validation order and containment.

## Agent skills

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

Frontmatter must be YAML with a `name` matching its skill directory and a nonblank string `description`. Additional frontmatter fields are allowed. Skill names use the same rules as agent names. The Markdown body must contain non-whitespace text. Files must be valid UTF-8 and at most 262144 bytes, including frontmatter; a leading BOM is accepted. Skills directories and files must resolve within their owning agent.

`fetch_agent_instructions` returns `skills: [{name, description}]`, sorted by name, and `skillProblems: [{name, path, reason}]`. Missing skills produce empty arrays. Invalid skills are reported individually without preventing agent instructions or valid skills from being returned. `list_agents` does not inspect or return skills.

Fetch a skill's body using both its owning agent and skill name:

```json
{"name":"fetch_skill_instructions","arguments":{"projectRoot":"E:/Source/Github/StarCruiseStudios/Agent","agentName":"orchestrator","skillName":"dispatch"}}
```

The result contains `agentName`, skill `name`, `description`, `instructions` (the body after frontmatter), `projectRoot`, `compassPath`, `agentPath`, `skillPath`, and `catalogProblems`. A skill name is scoped to its agent; two agents can define different skills with the same name. Unknown skills return `unknown_skill`; malformed skills return `malformed_skill`, with containment and case collisions retaining their specific error codes.

## Referenced Compass directories

Each Compass directory can optionally contain `config.json`:

```json
{
  "directories": ["../../shared/.compass", "E:/Company/agents/.compass"]
}
```

The config contains only a `directories` array of nonblank strings. Entries point directly to Compass directories, not project roots. Relative paths resolve against the canonical directory containing the config. Absolute paths are supported. Referenced directories can contain their own configs.

References support `~`, `~/.compass` (also `~\.compass` on Windows), and environment variables in `$VAR`, `${VAR}`, or `%VAR%` form. Variables come from the MCP server process environment, expand once, and are followed by leading home-directory expansion. For example:

```json
{
  "directories": ["~/.compass", "${COMPASS_SHARED}/.compass", "%USERPROFILE%/team/.compass"]
}
```

Unset or empty variables produce an `invalid_reference` problem for that entry; other references still load. Expanded relative paths remain relative to the containing config. Substitutions also apply in nested catalogs. Shell expressions and `~username` expansion are not supported.

Compass visits the project catalog first, then follows references depth first in config order. The first definition of each agent wins, including all of its skills. Skills are never merged across definitions, and an invalid winning agent does not fall back to a later definition. Existing case-collision checks still apply within each directory. Final agent summaries are sorted by name.

Canonical real paths identify directories, with case folding on Windows. Shared dependencies load once; a reference back to an active ancestor is reported as `catalog_cycle` with a `chain` of canonical paths, and that edge is skipped. Invalid configs (`invalid_config`) and missing/unreadable references (`catalog_unreadable`) are reported while local agents and other branches remain available. Invalid configs contribute no outgoing references. Every request reads the graph again.

List responses retain the project's `compassPath` and `found` fields and include graph diagnostics in `problems`. Successful agent and skill fetches include graph diagnostics in `catalogProblems`; their `compassPath` identifies the directory containing the selected agent. An absent project catalog retains existing missing-catalog behavior and does not trigger an ancestor search. All three tools are read-only.
