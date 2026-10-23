---
type: Backlog
title: Exploration Backlog
description: "Pages the wiki still needs, questions it could not answer, and content that looks stale."
status: draft
generated: { by: architecture-wiki/claude, at: 2026-10-22T00:00:00Z }
scope: landscape
systems: [compass, codex-commander, skills-library, armory, overmind, spec-n-roll, atlas, oracle]
depth: overview
sources_commit: 502b3be
---

# Exploration Backlog

Each entry names the path where its page should go. Paths are relative to the wiki root.

## Landscape

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Compass use of the Oracle pack | question | Unknown | Low | `concepts/armory-workspace.md` | [Armory workspace](/wiki/concepts/armory-workspace.md)  | 2026-10-22 | Oracle holds a [.compass](https://github.com/StarCruiseStudios/Oracle/tree/main/.compass/oracle-style-guide) pack, and Compass reads `.compass` folders. No file read states whether a Compass configuration points at it, or how the Agent repository treats the downloaded `armory.ts` and generated workspace file in its ignore rules. |

## System: armory

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Armory command implementation | component | Needs page | Medium | `areas/agent-workspace/systems/armory/containers/armory-cli/overview.md` | [Armory](/wiki/areas/agent-workspace/systems/armory/overview.md)  | 2026-10-22 | Only the README and the dependency traversal were read. Clone path rules for branches and groups, workspace merging, and managed ignore blocks need tracing. Start at [armory.ts](https://github.com/StarCruiseStudios/Armory/blob/main/armory.ts). |

## System: atlas

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rule engine and module model | concept | Needs page | Medium | `areas/engineering-toolkits/systems/atlas/concepts/rules-and-module-model.md` | [Atlas](/wiki/areas/engineering-toolkits/systems/atlas/overview.md)  | 2026-10-22 | The model and rule semantics are documented in [understanding-atlas.md](https://github.com/StarCruiseStudios/Atlas/blob/main/docs/understanding-atlas.md), but the implementation in [atlas-cli](https://github.com/StarCruiseStudios/Atlas/tree/main/src/atlas-cli) was not read. |
| Language generators | component | Needs page | Low | `areas/engineering-toolkits/systems/atlas/concepts/language-generators.md` | [Atlas](/wiki/areas/engineering-toolkits/systems/atlas/overview.md)  | 2026-10-22 | The TypeScript, Kotlin, Ruby, and C# tools under [src/tools/](https://github.com/StarCruiseStudios/Atlas/tree/main/src/tools) were listed but not read. |

## System: codex-commander

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Image processing internals | component | Needs page | Medium | `areas/agent-workspace/systems/codex-commander/concepts/image-processing.md` | [Sprite build pipeline](/wiki/areas/agent-workspace/systems/codex-commander/flows/sprite-build-pipeline.md)  | 2026-10-22 | `rgba-image.ts`, `despill-chroma.ts`, and `python-round.ts` were only surveyed. The Pillow-style rotation helpers suggest a port of a Python pipeline, which is unconfirmed. Start at [rgba-image.ts](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/rgba-image.ts). |
| Motion expressions in combine.json | concept | Needs page | Medium | `areas/agent-workspace/systems/codex-commander/concepts/motion-expressions.md` | [Codex Commander](/wiki/areas/agent-workspace/systems/codex-commander/overview.md)  | 2026-10-22 | The README lists constant, linear, keyframe, ellipse, and arc motion with easing, but `evaluateMotion` was not read. Start at [combine-images.ts:58](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L58). |
| Preview UI and tests | component | Needs page | Low | `areas/agent-workspace/systems/codex-commander/concepts/preview-and-tests.md` | [Codex Commander](/wiki/areas/agent-workspace/systems/codex-commander/overview.md)  | 2026-10-22 | The browser files in [preview/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/preview) and the tests in [tests/](https://github.com/StarCruiseStudios/Agent/tree/main/codex-commander/tests) were not read. |

## System: compass

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Design document and code disagree | question | Unknown | Medium | `areas/agent-workspace/systems/compass/containers/compass-server/overview.md` | [Compass Server](/wiki/areas/agent-workspace/systems/compass/containers/compass-server/overview.md)  | 2026-10-22 | [DESIGN.md:134](https://github.com/StarCruiseStudios/Agent/blob/main/compass/DESIGN.md#L134) limits `modelHint` to 64 characters and [DESIGN.md:384](https://github.com/StarCruiseStudios/Agent/blob/main/compass/DESIGN.md#L384) lists two tools, while [AgentMetadata.ts:28](https://github.com/StarCruiseStudios/Agent/blob/main/compass/src/catalog/AgentMetadata.ts#L28) allows 500 characters and [CompassMcpServer.ts:22-36](https://github.com/StarCruiseStudios/Agent/blob/main/compass/src/server/CompassMcpServer.ts#L22-L36) registers three tools. Confirm which is intended and fix the source document or code. |
| Catalog component | component | Needs page | Medium | `areas/agent-workspace/systems/compass/containers/compass-server/components/catalog.md` | [Compass Server](/wiki/areas/agent-workspace/systems/compass/containers/compass-server/overview.md)  | 2026-10-22 | The catalog classes hold most of the logic. Case-collision handling and error mapping deserve their own page. Start at [AgentCatalog.ts](https://github.com/StarCruiseStudios/Agent/blob/main/compass/src/catalog/AgentCatalog.ts). |
| Host configuration | concept | Needs page | Low | `areas/agent-workspace/systems/compass/concepts/host-configuration.md` | [Compass](/wiki/areas/agent-workspace/systems/compass/overview.md)  | 2026-10-22 | [DESIGN.md:261-320](https://github.com/StarCruiseStudios/Agent/blob/main/compass/DESIGN.md#L261-L320) documents setup for Codex, Cursor, Claude, and other stdio hosts. It was not read in full. |
| Compass test suite | concept | Needs page | Low | `areas/agent-workspace/systems/compass/containers/compass-server/concepts/testing.md` | [Compass Server](/wiki/areas/agent-workspace/systems/compass/containers/compass-server/overview.md)  | 2026-10-22 | Unit tests, a stdio integration test, and a fixture project exist under [compass/tests/](https://github.com/StarCruiseStudios/Agent/tree/main/compass/tests). They were listed but not read or run. |

## System: oracle

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Style guide versions | question | Unknown | Medium | `areas/engineering-toolkits/systems/oracle/containers/style-guide/overview.md` | [Oracle Style Guide](/wiki/areas/engineering-toolkits/systems/oracle/containers/style-guide/overview.md) | 2026-10-22 | [style_guide/](https://github.com/StarCruiseStudios/Oracle/tree/main/style_guide) is the authority in the [instructions](https://github.com/StarCruiseStudios/Oracle/blob/main/.compass/oracle-style-guide/instructions.md), while [oracle-react](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/packages/oracle-react/README.md) is implemented from [style_guide_v2/](https://github.com/StarCruiseStudios/Oracle/tree/main/style_guide_v2). No file read states which prevails. |
| Oracle core runtime primitives | component | Needs page | Medium | `areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/components/oracle-core.md` | [Oracle TypeScript Toolkit](/wiki/areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/overview.md) | 2026-10-23 | Observations, drafts, actions, events, jobs, scheduling, and state machines were read only through [Packages.md](https://github.com/StarCruiseStudios/Oracle/blob/main/ts/Docs/Packages.md). Start at [ts/packages/oracle-core](https://github.com/StarCruiseStudios/Oracle/tree/main/ts/packages/oracle-core). |
| Electron IPC and guarded services | flow | Needs page | Medium | `areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/flows/electron-ipc.md` | [Oracle TypeScript Toolkit](/wiki/areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/overview.md) | 2026-10-23 | The request, event, guarded transport, lifecycle, and offline help paths need a sequence read from [oracle-electron](https://github.com/StarCruiseStudios/Oracle/tree/main/ts/packages/oracle-electron). |
| Oracle UI, React, and Ink packages | component | Needs page | Medium | `areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/components/oracle-ui.md` | [Oracle TypeScript Toolkit](/wiki/areas/engineering-toolkits/systems/oracle/containers/typescript-toolkit/overview.md) | 2026-10-23 | The relationship between [oracle-ui](https://github.com/StarCruiseStudios/Oracle/tree/main/ts/packages/oracle-ui) and [oracle-react](https://github.com/StarCruiseStudios/Oracle/tree/main/ts/packages/oracle-react) is not stated. [oracle-ink](https://github.com/StarCruiseStudios/Oracle/tree/main/ts/packages/oracle-ink) needs its own page. |
| Kotlin native adapters and hosts | component | Needs page | Medium | `areas/engineering-toolkits/systems/oracle/containers/kotlin-toolkit/components/platform-adapters.md` | [Oracle Kotlin Toolkit](/wiki/areas/engineering-toolkits/systems/oracle/containers/kotlin-toolkit/overview.md) | 2026-10-23 | Library and example source were not read. Start at [kotlin/lib](https://github.com/StarCruiseStudios/Oracle/tree/main/kotlin/lib) and [PLATFORM-SERVICES.md](https://github.com/StarCruiseStudios/Oracle/blob/main/kotlin/Docs/PLATFORM-SERVICES.md). |
| Style guide platform skills | component | Needs page | Low | `areas/engineering-toolkits/systems/oracle/containers/style-guide/components/instruction-pack.md` | [Oracle Style Guide](/wiki/areas/engineering-toolkits/systems/oracle/containers/style-guide/overview.md) | 2026-10-23 | The desktop, mobile, and terminal skills under [.compass/oracle-style-guide/skills](https://github.com/StarCruiseStudios/Oracle/tree/main/.compass/oracle-style-guide/skills) were not read. |

## System: overmind

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Task and run lifecycle | flow | Needs page | High | `areas/agent-workspace/systems/overmind/containers/overmind-svc/flows/task-lifecycle.md` | [Overmind](/wiki/areas/agent-workspace/systems/overmind/overview.md)  | 2026-10-22 | Admission, scheduling, approval, and recovery are described across the READMEs but were not traced in code. Start at [OPERATIONS.md](https://github.com/StarCruiseStudios/Overmind/blob/main/apps/overmind-svc/OPERATIONS.md). |
| Robot adapters | component | Needs page | Medium | `areas/agent-workspace/systems/overmind/concepts/robot-adapters.md` | [Overmind](/wiki/areas/agent-workspace/systems/overmind/overview.md)  | 2026-10-22 | Adapters for several vendor CLIs and SDKs live in [extensions/](https://github.com/StarCruiseStudios/Overmind/tree/main/extensions) and were not read. |

## System: skills-library

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| How skills reach a host | question | Unknown | Medium | `areas/agent-workspace/systems/skills-library/overview.md` | [Skills Library](/wiki/areas/agent-workspace/systems/skills-library/overview.md)  | 2026-10-22 | The skills share the `SKILL.md` shape that Compass reads, but no file read states an install path or Compass pack for them. |
| deep-wiki and voice-guide references | concept | Needs depth | Low | `areas/agent-workspace/systems/skills-library/concepts/wiki-skills.md` | [Skills Library](/wiki/areas/agent-workspace/systems/skills-library/overview.md)  | 2026-10-22 | Only the skill files were read. Start at [skills/deep-wiki/references/](https://github.com/StarCruiseStudios/Agent/tree/main/skills/deep-wiki/references). |

## System: spec-n-roll

| Item | Type | Kind | Priority | Proposed path | Found while | Added | Why it matters / what is unknown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V0 folder and runtime status | question | Unknown | Medium | `areas/agent-workspace/systems/spec-n-roll/overview.md` | [Spec N' Roll](/wiki/areas/agent-workspace/systems/spec-n-roll/overview.md)  | 2026-10-22 | [V0/](https://github.com/StarCruiseStudios/SpecNRoll/tree/main/V0) holds a separate package with extension documentation. Its role relative to the stub runtime in [src/](https://github.com/StarCruiseStudios/SpecNRoll/tree/main/src) is unknown. |
