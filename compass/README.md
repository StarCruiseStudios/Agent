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

The fixture project at `tests/fixtures/project` can be used as `projectRoot` for a smoke test. See [DESIGN.md](DESIGN.md) for the full contract and host configuration samples. Tests compile the server before exercising its stdio entry and use temporary catalogs plus injected filesystem failures to verify validation order and containment.
