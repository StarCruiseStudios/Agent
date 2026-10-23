---
name: install-skill
description: Install a named skill from this repository's skills directory, along with any skills it depends on, into a target project or folder using the layout of a chosen agent framework (claude, cursor, codex, copilot, gemini, opencode) or the agentskills.io convention by default. Use when the user asks to install, copy, deploy, or add a skill from this repo to another project or agent.
compatibility: Works with any agent that can read, list, and copy files.
disable-model-invocation: true
metadata:
  version: "1.1"
---

# Install Skill

Copy a skill from this repo's `skills/` directory into a destination, together with every skill it depends on, using the skill layout of the target agent framework. Perform the copy yourself with your file tools or shell. Do not write an installer script.

## Inputs

| Input | Required | Meaning |
| --- | --- | --- |
| skill name | yes | Folder name under the repo's `skills/` directory (for example `architecture-wiki`) |
| destination | yes | Project root to install into (or a home directory for a user-level install). Create it if missing |
| framework | no | `agentskills` (default), `claude`, `cursor`, `codex`, `copilot`, `gemini`, `opencode` |

If the skill name or destination is missing, ask. If the framework is missing, use `agentskills` and say so. Do not ask.

## Layouts

Install each skill to `<destination>/<skills dir>/<skill name>/`:

| Framework | Skills dir |
| --- | --- |
| agentskills (default, [agentskills.io](https://agentskills.io) convention) | `.agents/skills` |
| codex | `.agents/skills` |
| claude | `.claude/skills` |
| cursor | `.cursor/skills` |
| copilot | `.github/skills` |
| gemini | `.gemini/skills` |
| opencode | `.opencode/skills` |

If the user gives an exact skills folder instead of a project root, install into it directly. If the framework is not listed, say so and ask for its skills directory rather than guessing.

## Workflow

1. **Find the source.** The source is the `skills/` directory at the root of this repo (the directory above `.agents/`). A valid skill is a subfolder containing `SKILL.md`. If the named skill does not exist, list the available skills and stop.
2. **Resolve dependencies.** Start with the requested skill and build a set of skills to install:
   - Read the `SKILL.md` frontmatter. Names listed in `metadata.dependencies` (comma-separated) are declared dependencies.
   - Read the skill's `SKILL.md` and files under its `references/`, `scripts/`, and assets. Any other skill in `skills/` that it names and relies on (for example "use deep-wiki instead", or a link to another skill's folder) is a dependency. Searching for each sibling skill's name as a whole word is a quick way to find candidates. Judge each hit: a skill that is only mentioned as an unrelated example is not a dependency.
   - Repeat for every dependency found until no new skills appear. Each skill is added once.
3. **Show the plan.** List the skills to install, why each is included (requested, declared, or mentioned in which file), and the target paths. Mention any mention-based dependency you were unsure about and how you decided.
4. **Check the target.** If `<skills dir>/<name>` already exists, do not overwrite it. Report it as skipped, and replace it only if the user asked to overwrite or reinstall.
5. **Copy.** Create the skills dir if needed and copy each skill folder whole (`SKILL.md`, `references/`, `scripts/`, assets) to `<skills dir>/<name>/`. Do not modify the copied files.
6. **Verify.** List the installed folders and confirm each contains `SKILL.md` and that every file from the source is present.
7. **Report.** State what was installed and where, which framework layout was used (and that it was the default if the user did not choose), what was skipped, and that some frameworks need a restart or reload to pick up new skills.
