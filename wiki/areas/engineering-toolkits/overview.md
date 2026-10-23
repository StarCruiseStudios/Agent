---
type: Area
title: Engineering Toolkits
description: The engineering toolkits area groups reusable toolkits that other projects build on.
status: draft
generated: { by: architecture-wiki/claude, at: 2026-10-22T00:00:00Z }
scope: area:engineering-toolkits
systems: [atlas, oracle]
depth: overview
sources_commits:
  StarCruiseStudios/Atlas: cefc201
  StarCruiseStudios/Oracle: 794c45c
---

# Engineering Toolkits

The engineering toolkits area groups reusable toolkits that other projects build on. One analyzes and enforces the architecture of a codebase, and the other supplies user interface libraries and the style guide behind them ([Atlas README](https://github.com/StarCruiseStudios/Atlas/blob/main/README.md), [Oracle README](https://github.com/StarCruiseStudios/Oracle/blob/main/README.md)). Each lives in its own repository and serves projects in several languages or platforms.

## Systems

- [Atlas](/wiki/areas/engineering-toolkits/systems/atlas/overview.md): architecture validation and diagrams for TypeScript, Kotlin, Ruby, and C# projects.
- [Oracle](/wiki/areas/engineering-toolkits/systems/oracle/overview.md): user interface toolkits and a style guide for desktop, mobile, and terminal applications.

## How the systems fit together

The two systems do not depend on each other in the files read. Both are consumed by projects in the [Agent workspace](/wiki/areas/agent-workspace/overview.md) area: [Spec N' Roll](/wiki/areas/agent-workspace/systems/spec-n-roll/overview.md) uses Atlas for architecture checks ([package.json](https://github.com/StarCruiseStudios/SpecNRoll/blob/main/package.json)), and [Overmind](/wiki/areas/agent-workspace/systems/overmind/overview.md) includes Oracle in its workspace ([README](https://github.com/StarCruiseStudios/Overmind/blob/main/README.md)).

## Pages in this area

No area-level pages exist yet.

## Landscape-level material

- [Armory workspace](/wiki/concepts/armory-workspace.md): how the repositories that these systems live in are brought together.
