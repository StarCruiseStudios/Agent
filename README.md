# Agent

A collection of tools, skills, and instructions for working with AI coding agents, maintained by StarCruise Studios.

## Contents

| Path | What it is |
| --- | --- |
| [`compass/`](./compass/README.md) | A local, read-only MCP server that [dynamically routes agents](https://www.starcruisestudios.com/blog/discovering-agent-instructions-with-mcp/) to role specific instruction sets. See [`DESIGN.md`](./compass/DESIGN.md). |
| [`codex-commander/`](./codex-commander/README.md) | Source artwork and build tooling for the Commander custom Codex pet. |
| [`skills/`](./skills) | A library of reusable agent skills (see below). |
| [`instructions/`](./instructions) | A library of instruction sets meant to be installed into other projects' `AGENTS.md` or `CLAUDE.md`. |
| [`wiki/`](./wiki/index.md) | Architecture wiki for this repository and its sibling repositories. |

## Skills

| Skill | Purpose |
| --- | --- |
| `architecture-wiki` | Build and maintain an architectural wiki as an Open Knowledge Format bundle. |
| `deep-wiki` | Write an in-depth wiki page for a single code symbol. |
| `code-quality-review` | Run a strict maintainability review of abstractions, file size, and condition growth. |
| `plan-tracker` | Run a staged planning workflow with a subagent per stage and a resumable progress file. |
| `track-progress` | Keep the progress file current while implementing a plan, and resume after interruptions. |
| `voice-guide` | Create or revise a reusable voice and tone guide. |

Use the `install-skill` skill to install one of these into another project, and `install-instructions` to install an instruction set.

## Armory workspace

Armory reads [`armory.json`](./armory.json) and clones these sibling repositories next to this one:

| Repository | What it is |
| --- | --- |
| [Armory](https://github.com/StarCruiseStudios/Armory) | A package manager for modules of source code, built for agentic development. |
| [Atlas](https://github.com/StarCruiseStudios/Atlas) | A toolkit for understanding and enforcing the architecture of a software project. |
| [Oracle](https://github.com/StarCruiseStudios/Oracle) | User interface toolkits and a style guide for desktop, mobile, and terminal applications. |
| [Overmind](https://github.com/StarCruiseStudios/Overmind) | Coordinates work for AI agents on a local machine. |
| [SpecNRoll](https://github.com/StarCruiseStudios/SpecNRoll) | A toolkit for spec-driven development with AI agents. |

```sh
node armory.ts sync
```

Other commands are `init`, `clone`, `fetch`, `pull`, and `update`. Run `node armory.ts --help` for details.
