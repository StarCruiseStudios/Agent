---
type: System
title: Codex Commander
description: "Codex Commander is the source package for 'Commander', a custom pet for Codex."
resource: https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander
status: draft
generated: { by: architecture-wiki/claude, at: 2026-10-22T00:00:00Z }
sources:
  - resource: https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md
    title: codex-commander/README.md
  - resource: https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/scripts/cli.ts
    title: codex-commander/scripts/cli.ts
  - resource: https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/AGENTS.md
    title: codex-commander/AGENTS.md
scope: system:codex-commander
locations:
  - repo: StarCruiseStudios/Agent
    paths: [codex-commander/]
depth: overview
sources_commit: 502b3be
---

# Codex Commander

Codex Commander is the source package for "Commander", a custom pet for Codex. The pet is a pixel-art battlesuit character with a scout drone. The package holds the artwork, the configuration that composites the character and drone layers, and a command line tool that builds, validates, previews, and installs the finished sprite sheet ([README](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md), [pet.json](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/output/pet.json)).

## Code location

| Repo | Paths | What is there | Source |
| --- | --- | --- | --- |
| `StarCruiseStudios/Agent` | [codex-commander/reference/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/reference) | Pose references for the artwork | [codex-commander/reference/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/reference) |
| `StarCruiseStudios/Agent` | [codex-commander/source/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/source) | Frame images and the composition file for each animation | [codex-commander/source/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/source) |
| `StarCruiseStudios/Agent` | [codex-commander/output/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/output) | The installable pet files | [codex-commander/output/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/output) |
| `StarCruiseStudios/Agent` | [codex-commander/src/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/src) and [scripts/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/scripts) | Compositing, atlas assembly, validation, preview server, and command line entry | [codex-commander/src/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/src) |
| `StarCruiseStudios/Agent` | [codex-commander/preview/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/preview) | Browser preview of the animations | [codex-commander/preview/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/preview) |

## Responsibilities and boundary

The package turns edited frame images into one installable sprite sheet and checks the result. Artists create and edit the frames, and the tooling combines them. The contribution guide sets the visual rules for the artwork, including how the character and drone relate in every frame ([AGENTS.md](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/AGENTS.md)).

## Architecture

The system is a single command line application with a local preview server. Its commands cover four jobs: compositing layers into frames, assembling and validating the sprite sheet, installing the result for Codex, and previewing animations in a browser ([cli.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/scripts/cli.ts)). Compositing and sheet assembly are separate steps, so artwork can be inspected before a build ([README](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md)). The system has no separately deployable parts, so it is not split into containers.

## Key flows

[Sprite build pipeline](/wiki/areas/agent-workspace/systems/codex-commander/flows/sprite-build-pipeline.md) covers how layered frames become a validated sprite sheet.

## Key entities

- **Atlas.** The sprite sheet, a grid of equally sized cells that hold animation frames ([pet-atlas.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/pet-atlas.ts)).
- **Animation state.** A named behavior of the pet, such as idle or running, that occupies one row of the atlas ([pet-layout.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/pet-layout.ts)).
- **Look direction.** A cell that shows the pet attending to a direction around a circle ([pet-layout.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/pet-layout.ts)).
- **Composition file.** A versioned JSON file in each animation folder that describes how the character and drone layers combine ([README](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md)).

## Interfaces and dependencies

Developers use npm scripts that run the command line tool ([package.json](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/package.json)). The output is consumed by Codex from the user's home directory after installation ([cli.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/scripts/cli.ts)). Image work relies on third-party image libraries and a WebAssembly WebP codec ([webp-codec.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/webp-codec.ts)).

## Runtime and deployment

The tooling runs locally on a developer machine. After installing the pet, the developer restarts Codex or reselects the pet ([README](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md)).

## Design decisions and constraints

- **Combine and build are separate.** Building only assembles frames that are already combined ([README](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md)).
- **All-or-nothing frame publishing.** Combined frames replace the existing frames only after every selected animation renders ([combine-images.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts)).
- **Local-only preview.** The preview server listens on the loopback interface and refuses paths outside the package ([preview-server.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/preview-server.ts)).

## Pages in this system

- Flows: [Sprite build pipeline](/wiki/areas/agent-workspace/systems/codex-commander/flows/sprite-build-pipeline.md)

## Wider scope

- [Agent workspace](/wiki/areas/agent-workspace/overview.md): the area that holds this system.
