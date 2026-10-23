---
type: Container
title: Oracle Style Guide
description: "The Oracle style guide is the reference for Oracle interface design, published as HTML and Markdown pages with a reader application and an agent instruction pack."
tags: [style-guide, design, agents]
resource: https://github.com/StarCruiseStudios/Oracle/tree/main/style_guide
status: draft
generated: { by: architecture-wiki/claude-sonnet-5-5, at: 2026-10-23T00:00:00Z }
sources:
  - resource: https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md
    title: .compass/oracle-style-guide/instructions.md
  - resource: https://github.com/StarCruiseStudios/Oracle/blob/main/ts/apps/oracle-style-guide/README.md
    title: oracle-style-guide README
scope: container:style-guide
locations:
  - repo: StarCruiseStudios/Oracle
    paths: [style_guide/, style_guide_v2/, .compass/oracle-style-guide/, .agents/skills/, ts/apps/oracle-style-guide/]
depth: standard
sources_commit: 6d7dd0b
---

# Oracle Style Guide

The style guide defines the shared look and behavior of Oracle interfaces for desktop, mobile, and terminal. Its identity is calm precision: dark neutral material, with color reserved for actions, navigation, focus, and named status ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)). It is a container of the [Oracle](/wiki/areas/engineering-toolkits/systems/oracle/overview.md) system and is the specification that both toolkits implement.

## Code location

| Repo | Paths | What is there | Source |
| --- | --- | --- | --- |
| `StarCruiseStudios/Oracle` | [style_guide/](https://github.com/StarCruiseStudios/Oracle/tree/main/style_guide) | HTML pages for principles, color, surfaces, shape, typography, layout, icons, interaction, motion, components, accessibility, tokens, terminal, and glyphs | [instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md) |
| `StarCruiseStudios/Oracle` | [style_guide_v2/](https://github.com/StarCruiseStudios/Oracle/tree/main/style_guide_v2) | Markdown pages grouped as getting started, foundations, components, patterns, and themes, with example guidance and implementation plans | [style_guide_v2/](https://github.com/StarCruiseStudios/Oracle/tree/main/style_guide_v2) |
| `StarCruiseStudios/Oracle` | [.compass/oracle-style-guide/](https://github.com/StarCruiseStudios/Oracle/tree/main/.compass/oracle-style-guide) | The instruction pack with agent metadata, instructions, and desktop, mobile, and terminal skills | [agent.json](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/agent.json) |
| `StarCruiseStudios/Oracle` | [.agents/skills/](https://github.com/StarCruiseStudios/Oracle/tree/main/.agents/skills) | Repository-level agent skills for each platform | [desktop SKILL.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.agents/skills/oracle-developer-ui-desktop/SKILL.md) |
| `StarCruiseStudios/Oracle` | [ts/apps/oracle-style-guide/](https://github.com/StarCruiseStudios/Oracle/tree/main/ts/apps/oracle-style-guide) | The reader application. This path is shared with the [TypeScript toolkit](/wiki/areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/overview.md) workspace. | [README](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/apps/oracle-style-guide/README.md) |

## Responsibilities

The guide owns design decisions. Topic pages own their values: color owns palette roles and ANSI fallbacks, surfaces owns gradients, shape owns contour, typography owns type metrics, layout owns spacing, and motion owns time. Component pages combine those values and do not define competing ones ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)). The guide does not specify light or custom themes ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).

## Components

| Component | Role | Source |
| --- | --- | --- |
| HTML guide | The guide that the instruction pack treats as the only authority for findings and decisions. It includes terminal and glyph pages for the character-grid implementation. | [instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md) |
| Markdown guide | A second set of pages with Neon and Iridium themes. Oracle React is implemented from it, and the reader application renders it. | [oracle-react README](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/packages/oracle-react/README.md), [oracle-style-guide README](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/apps/oracle-style-guide/README.md) |
| Reader application | A browser application that renders the Markdown guide through Oracle React's application bar and navigation rail and produces a static site. | [oracle-style-guide README](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/apps/oracle-style-guide/README.md) |
| Instruction pack | An agent that reviews, designs, and modifies interface work against the HTML guide, with one skill per platform. | [instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md), [agent.json](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/agent.json) |

## Interfaces

**Agent modes.** The pack supports four modes: review a change, review files, design a change, and author or modify. Reviews report a verdict of compliant, compliant with notes, or non-compliant, with findings ordered by severity ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).

**Platform skills.** The pack requires the agent to fetch the skill for each affected platform from Compass and to avoid applying one platform's rules to another. Desktop and mobile form one graphical system, and the terminal is a separate implementation of the shared roles on a character grid ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).

**Reader.** The reader discovers the five guide groups, keeps reading positions, and validates local links and anchors during the build. It treats Markdown as data, skips raw HTML, and uses registered directives for example previews ([oracle-style-guide README](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/apps/oracle-style-guide/README.md)).

## Runtime and deployment

The reader builds from the TypeScript workspace with `npm run build -w oracle-style-guide`, which produces a static site that needs no route rewrites ([oracle-style-guide README](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/apps/oracle-style-guide/README.md)).
## Key flows and entities

- **Compliance review.** The agent reads the relevant guide pages, fetches the platform skill, judges only the changed interface, and reports gaps in the guide as findings without editing it ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).
- **Independent channels.** Action, selection, focus, and status are four independent channels. A status is never conveyed by color alone ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).
- **Semantic tokens.** Interface code uses dot-separated semantic and component roles, never ad hoc hex values ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).

## Design decisions and constraints

- Existing code is never the specification, and a page wins over a platform skill when they disagree ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).
- The signature element is a thin chamfered frame on major regions only ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).
- Content language is shared across platforms: sentence case, specific verbs, and separate wording for saved, accepted, and completed ([instructions.md](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md)).

## Open questions

- No file read states how the HTML guide and the Markdown guide relate, or which one prevails if they disagree.
- The contents of the three platform skills and the individual guide pages were not read.
- Whether any tool configures Compass to load this pack is tracked on the [Armory workspace](/wiki/concepts/armory-workspace.md) page.

## Pages in this container

No component, flow, entity, or concept pages exist yet. The [exploration backlog](/wiki/exploration-backlog.md) lists the planned ones.

## Wider scope

- [Oracle](/wiki/areas/engineering-toolkits/systems/oracle/overview.md): the system that holds this container.
- [TypeScript toolkit](/wiki/areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/overview.md) and [Kotlin toolkit](/wiki/areas/engineering-toolkits/systems/oracle/containers/kotlin-toolkit/overview.md): the implementations of this specification.
