---
type: Area
title: Agent Workspace
description: The agent workspace area groups the tools that support working with AI coding agents.
status: draft
generated: { by: architecture-wiki/claude, at: 2026-10-22T00:00:00Z }
scope: area:agent-workspace
systems: [compass, codex-commander, skills-library, armory, overmind, spec-n-roll]
depth: overview
sources_commit: 502b3be
---

# Agent Workspace

The agent workspace area groups the tools that support working with AI coding agents. Some of them serve agents at run time, some provide reusable guidance that agents follow, and some build assets for the agent applications that host them. The systems are independent and communicate with their hosts through files and the Model Context Protocol (MCP), not with each other ([Compass design](https://github.com/StarCruiseStudios/Agent/blob/main/compass/DESIGN.md), [Codex Commander](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md)).

## Systems

- [Compass](/wiki/areas/agent-workspace/systems/compass/overview.md): a local MCP server that returns agent instruction packs and skills.
- [Codex Commander](/wiki/areas/agent-workspace/systems/codex-commander/overview.md): the source and build tooling for a custom Codex pet.
- [Skills Library](/wiki/areas/agent-workspace/systems/skills-library/overview.md): reusable agent skills.
- [Armory](/wiki/areas/agent-workspace/systems/armory/overview.md): a package manager for source modules that generates a multi-root workspace.
- [Overmind](/wiki/areas/agent-workspace/systems/overmind/overview.md): local coordination of tasks, approvals, and robots for AI agents.
- [Spec N' Roll](/wiki/areas/agent-workspace/systems/spec-n-roll/overview.md): a toolkit for spec-driven development with AI agents.

## Landscape

The [landscape home](/wiki/overview.md) describes the repository as a whole. [Armory workspace](/wiki/concepts/armory-workspace.md) explains how the repositories behind Armory, Overmind, and Spec N' Roll are checked out together with it.
