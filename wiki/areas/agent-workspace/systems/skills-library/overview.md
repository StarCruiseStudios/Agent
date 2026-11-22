---
type: System
title: Skills Library
description: The skills library is a folder of reusable agent skills, each a directory with a SKILL.md file.
resource: https://github.com/StarCruiseStudios/Agent/tree/main/skills
status: draft
generated: { by: architecture-wiki/claude-sonnet-5-5, at: 2026-11-21T00:00:00Z }
sources:
  - resource: https://github.com/StarCruiseStudios/Agent/tree/main/skills
    title: skills/
  - resource: https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md
    title: install-skill
scope: system:skills-library
locations:
  - repo: StarCruiseStudios/Agent
    paths: [skills/]
depth: overview
sources_commit: 863e6e0
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

Skills share a file shape: YAML front matter with a name and a description, followed by Markdown instructions. [Compass](/wiki/areas/agent-workspace/systems/compass/overview.md) reads skills of the same shape from inside an agent pack ([SkillCatalog.ts](https://github.com/StarCruiseStudios/Agent/blob/main/compass/src/catalog/SkillCatalog.ts)). Compass does not deliver these skills to a host. Compass treats an agent as an instruction pack and states that it never installs a pack into a host skill directory ([DESIGN.md](https://github.com/StarCruiseStudios/Agent/blob/main/compass/DESIGN.md)). It reads skills only from `<agent>/skills/<skill>/SKILL.md` inside a pack ([README.md](https://github.com/StarCruiseStudios/Agent/blob/main/compass/README.md)). The repository root contains no Compass catalog directory, so the library is not itself a pack (inferred from a listing of the repository root at `863e6e0`).

## How skills reach a host

The repository delivers skills by copying them. The `install-skill` skill copies a named skill folder, together with the skills it depends on, from `skills/` into a target project or home directory ([install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md)). The skills directory depends on the chosen agent framework:

| Framework | Skills directory | Source |
| --- | --- | --- |
| agentskills (default), codex | `.agents/skills` | [install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md) |
| claude | `.claude/skills` | [install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md) |
| cursor | `.cursor/skills` | [install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md) |
| copilot | `.github/skills` | [install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md) |
| gemini | `.gemini/skills` | [install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md) |
| opencode | `.opencode/skills` | [install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md) |

Dependencies come from a `metadata.dependencies` list in the skill front matter, or from other skills that the skill text names and relies on ([install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md)). The `plan-tracker` and `track-progress` skills declare each other this way ([plan-tracker](https://github.com/StarCruiseStudios/Agent/blob/main/skills/plan-tracker/SKILL.md), [track-progress](https://github.com/StarCruiseStudios/Agent/blob/main/skills/track-progress/SKILL.md)). The installer is itself an agent skill that the agent follows with its own file tools, not an installer script ([install-skill](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-skill/SKILL.md)).

The `install-instructions` skill offers a second route. It appends the content of a skill, or of a folder under `instructions/`, to the agent instructions file of a target project, such as `AGENTS.md` or `CLAUDE.md` ([install-instructions](https://github.com/StarCruiseStudios/Agent/blob/main/.agents/skills/install-instructions/SKILL.md)). The repository README names both installers as the way to install a skill from this library into another project ([README.md](https://github.com/StarCruiseStudios/Agent/blob/main/README.md)).

## Open questions

- Whether any project actually installs these skills through a Compass pack is not stated in the files read. No file in the Agent repository defines such a pack.

## Wider scope

- [Agent workspace](/wiki/areas/agent-workspace/overview.md): the area that holds this system.
