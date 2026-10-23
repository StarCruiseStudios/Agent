---
type: Landscape
title: Agent Repository Architecture Wiki
description: The Agent repository is a collection of tools for working with AI coding agents, alongside five sibling repositories that Armory checks out beside it.
status: draft
generated: { by: architecture-wiki/claude, at: 2026-10-22T00:00:00Z }
scope: landscape
systems: [compass, codex-commander, skills-library, armory, overmind, spec-n-roll, atlas, oracle]
depth: overview
sources_commit: 502b3be
---

# Agent Repository Architecture Wiki

The Agent repository is a collection of tools for working with AI coding agents. It covers the runnable tools that support agents and the reusable skills that guide them, along with the artwork and build tooling for a custom Codex pet ([repository](https://github.com/StarCruiseStudios/Agent)). The tools are independent of each other and share a repository and a TypeScript toolchain. The repository also works alongside five sibling repositories that [Armory](/wiki/areas/agent-workspace/systems/armory/overview.md) checks out next to it, described in [Armory workspace](/wiki/concepts/armory-workspace.md). The [systems catalog](/wiki/areas/catalog.md) lists every system.
