---
type: System
title: Skills Library
description: The skills library is a folder of reusable agent skills, each a directory with a SKILL.md file.
resource: https://github.com/StarCruiseStudios/Agent/tree/main/skills
status: draft
generated: { by: architecture-wiki/claude, at: 2026-10-22T00:00:00Z }
sources:
  - resource: https://github.com/StarCruiseStudios/Agent/tree/main/skills
    title: skills/
scope: system:skills-library
locations:
  - repo: StarCruiseStudios/Agent
    paths: [skills/]
depth: overview
sources_commit: 502b3be
---

# Skills Library

The skills library is a folder of reusable agent skills. Each skill is a directory with a `SKILL.md` file whose front matter gives the skill a name and a description. An agent reads the description to decide when the skill applies, and then follows the instructions in the file ([architecture-wiki](https://github.com/StarCruiseStudios/Agent/blob/main/skills/architecture-wiki/SKILL.md), [deep-wiki](https://github.com/StarCruiseStudios/Agent/blob/main/skills/deep-wiki/SKILL.md), [voice-guide](https://github.com/StarCruiseStudios/Agent/blob/main/skills/voice-guide/SKILL.md)).

## Code location

| Repo | Paths | What is there | Source |
| --- | --- | --- | --- |
| `StarCruiseStudios/Agent` | [skills/](https://github.com/StarCruiseStudios/Agent/tree/main/skills) | One folder per skill, each with a skill file and optional reference files | [skills/](https://github.com/StarCruiseStudios/Agent/tree/main/skills) |

## Responsibilities and boundary

The library stores skill text. It holds procedures that agents follow and contains no executable service. Skills that share a topic can point to one another. For example, the wiki generation skill defers single-symbol detail to the symbol documentation skill ([architecture-wiki](https://github.com/StarCruiseStudios/Agent/blob/main/skills/architecture-wiki/SKILL.md)).

## Interfaces and dependencies

Skills share a file shape: YAML front matter with a name and a description, followed by Markdown instructions. [Compass](/wiki/areas/agent-workspace/systems/compass/overview.md) reads skills of the same shape from inside an agent pack ([SkillCatalog.ts](https://github.com/StarCruiseStudios/Agent/blob/main/compass/src/catalog/SkillCatalog.ts)). The repository does not define how the skills in this library reach a host.

## Wider scope

- [Agent workspace](/wiki/areas/agent-workspace/overview.md): the area that holds this system.
