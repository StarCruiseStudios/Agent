---
type: Concept
title: Motion Expressions
description: How a layer transform property in combine.json is either a constant or a motion object that evaluateMotion turns into a per-frame value.
tags: [codex-commander, combine, animation]
resource: https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts
status: draft
generated: { by: architecture-wiki/claude-sonnet-5-5, at: 2026-11-21T12:00:00Z }
sources:
  - id: combine-images
    resource: https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts
    title: codex-commander/src/combine-images.ts
  - id: readme
    resource: https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md
    title: codex-commander/README.md
  - id: tests
    resource: https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/tests/combine-images.test.ts
    title: codex-commander/tests/combine-images.test.ts
scope: system:codex-commander
systems: [codex-commander]
depth: standard
sources_commit: 863e6e0
---

# Motion Expressions

Each layer in a `combine.json` can animate its `position`, `scale`, `rotation`, and `opacity` across the animation's ordered frame list. Instead of one value per frame, the config gives either a literal or a small "motion object" with a `type`, and `evaluateMotion` resolves it to the value for the frame being rendered ([combine-images.ts:48-111](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L48-L111)). This keeps frame-to-frame movement, such as the drone orbiting the robot, declarative and out of the image files.

## How it is realised

`evaluateMotion(spec, frame, index, frames, propertyName)` has one rule for anything that is not a motion object: if `spec` is not a plain object or has no `type` key, it is returned unchanged, so constants and plain arrays pass straight through ([combine-images.ts:65-67](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L65-L67)). Otherwise it branches on `type`. The `propertyName` is used in error text and to restrict `ellipse` and `arc` to `position` ([combine-images.ts:95-98](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L95-L98)).

Progress through the animation is the frame's index divided by the last index, so the first frame is 0 and the last is 1. A one-frame animation always has progress 0 ([combine-images.ts:423-425](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L423-L425)).

| Motion type | Behaviour | Source |
| --- | --- | --- |
| (constant) | Number or array returned as given. | [combine-images.ts:65-67](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L65-L67) |
| `frames` | Looks up the current frame name in `values`; falls back to `default` if present; otherwise throws. No interpolation or easing. | [combine-images.ts:73-85](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L73-L85) |
| `linear` | Interpolates from `start` to `end` using overall progress, optionally shaped by `easing`. | [combine-images.ts:87-89](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L87-L89) |
| `keyframes` | Interpolates between values pinned to named frames, with per-segment easing. | [combine-images.ts:91-93](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L91-L93), [combine-images.ts:353-393](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L353-L393) |
| `ellipse` | `position` only. Sweeps an angle (degrees) from `startAngle` to `endAngle` and returns `center + radii * (cos, sin)`. | [combine-images.ts:95-108](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L95-L108) |
| `arc` | Same as `ellipse` with one `radius` used for both axes. | [combine-images.ts:99-103](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L99-L103) |

Any other `type` throws a `ConfigError` ([combine-images.ts:110](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L110)).

### Interpolation and easing

`interpolate` works on a number or on a vector. A numeric `start` gives a numeric result. Anything else must be a number array, and `end` must have the same length ([combine-images.ts:395-402](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L395-L402)). Non-finite or wrongly shaped values throw `ConfigError` ([combine-images.ts:427-439](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L427-L439)).

`easing` defaults to `linear` and remaps progress through one of five curves: `linear`, `step` (0 until progress reaches 1, then 1), `ease-in` (quadratic), `ease-out`, and `ease-in-out`. An unknown name throws ([combine-images.ts:404-421](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L404-L421)). The name is validated only when a branch calls the easing function, so a bad `easing` on a `frames` motion is never checked ([combine-images.ts:71](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L71), [combine-images.ts:73-85](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L73-L85)). The same holds for a keyframe segment that is never reached because the frame falls outside the keyframe range (inference from the control flow below).

### Keyframe lookup

`evaluateKeyframes` requires a non-empty array whose entries each have `frame` and `value`, with `frame` naming a frame in the animation's list ([combine-images.ts:354-365](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L354-L365)). Entries are sorted by frame position, and two entries on the same frame are rejected ([combine-images.ts:372-375](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L372-L375)). Frames before the first keyframe or after the last hold that keyframe's value. Between two keyframes the value is interpolated using the left keyframe's `easing` over that segment's own span ([combine-images.ts:376-391](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L376-L391)).

### Ellipse and arc geometry

The angle is `startAngle + (endAngle - startAngle) * eased(progress)`, converted from degrees to radians ([combine-images.ts:104-106](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L104-L106)). The result is `[cx + rx*cos, cy + ry*sin]` ([combine-images.ts:107](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L107)). Because the last frame has progress 1, a full 360-degree sweep ends at the start point on the last frame (inference from the progress rule above). The checked-in running-left config sweeps 180 to 540 degrees with a small radius to move the drone in a small loop ([running-left/combine.json](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/source/running-left/combine.json)).

## Where it applies

`renderLayer` evaluates the four animatable properties per layer per frame, in this order: `scale` (a number for uniform scale, or a two-element array), `rotation` (degrees, applied only when non-zero), `opacity` (must lie between 0 and 1), and `position` (an `[x, y]` offset rounded to whole pixels with a Python-style round) ([combine-images.ts:232-252](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L232-L252)). Each defaults to a constant (1, 0, 1, `[0, 0]`) when absent. `anchor` and `resampling` are read as plain values and are not animatable ([combine-images.ts:227-231](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L227-L231)).

The transform each layer sees is its base `transform` merged with `frameOverrides[frame]` by a shallow spread, so an override replaces a whole property, motion object included, for that frame ([combine-images.ts:300-311](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L300-L311)). The README documents the property list, the motion types, and the override rule ([README.md:63](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/README.md#L63)). The `combine` step that runs these expressions is covered in [Sprite build pipeline](/wiki/areas/agent-workspace/systems/codex-commander/flows/sprite-build-pipeline.md).

The checked-in animation configs use the `frames` type for hand-tuned positions and rotations (for example [idle/combine.json](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/source/idle/combine.json)) and `ellipse` for the drone loop. The `linear`, `keyframes`, and `arc` types appear in the README and unit tests but in no `type` value I found in `source/*/combine.json`.

## Working with it

- Use `frames` for exact per-frame art direction. Use `keyframes` or `linear` when motion is smooth and you want to change frame count without retyping every value.
- Keyframe `frame` names must exist in the animation's `frames` list, so renaming a frame breaks them ([combine-images.ts:363-365](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L363-L365)).
- Vector motions must keep the same length at both ends, two numbers for `position` ([combine-images.ts:399-400](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L399-L400)).
- `ellipse` and `arc` throw for any property other than `position`.
- `opacity` outside 0 to 1 and a zero scale component fail the render with a `ConfigError` ([combine-images.ts:241-244](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L241-L244), [combine-images.ts:261-264](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L261-L264)).
- The unit test covers `linear`, `frames`, `keyframes`, `ellipse`, and `arc` ([combine-images.test.ts:13-48](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/tests/combine-images.test.ts#L13-L48)). From reading it, it does not exercise `default`, non-linear easings, or error paths.

## Trade-offs and alternatives

The design is a single stateless function driven by JSON data, with failures raised as `ConfigError` ([combine-images.ts:58-111](https://github.com/StarCruiseStudios/Agent/blob/main/codex-commander/src/combine-images.ts#L58-L111)). No source states why only these motion types exist.

## Open questions
- Why `arc`, `linear`, and `keyframes` exist when no checked-in config uses them; no commit history was read.

## Related
- [Codex Commander](/wiki/areas/agent-workspace/systems/codex-commander/overview.md): the system this concept belongs to.
- [Sprite build pipeline](/wiki/areas/agent-workspace/systems/codex-commander/flows/sprite-build-pipeline.md): the flow whose `combine` step runs these expressions.
