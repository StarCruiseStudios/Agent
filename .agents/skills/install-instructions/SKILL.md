---
name: install-instructions
description: Install an instruction set from this repository's instructions directory, or the content of a skill from its skills directory, into the agent instructions file (AGENTS.md, CLAUDE.md, GEMINI.md, and so on) of a target project. Appends when no similar instructions exist; when similar instructions exist, summarizes the diff and waits for the user to choose overwrite or merge. Use when the user asks to add, install, or sync instructions from this repo into a project's agent instructions file.
compatibility: Works with any agent that can read, list, and edit files.
disable-model-invocation: true
metadata:
  version: "1.0"
---

# Install Instructions

Add an instruction set from this repo to the instructions file a target project's agent reads, without clobbering anything already there. Perform the work yourself with your file tools or shell. Do not write an installer script. For installing a skill as a skill folder, use `install-skill` instead.

## Inputs

| Input | Required | Meaning |
| --- | --- | --- |
| source | yes | A folder name under the repo's `instructions/` directory (for example `agents-exceptions`), or a folder name under `skills/` (for example `voice-guide`) |
| destination | yes | Project root to install into (or a home directory for a user-level install). Create it if missing |
| framework | no | `agentskills` (default), `claude`, `cursor`, `codex`, `copilot`, `gemini`, `opencode` |

If the source or destination is missing, ask. If the framework is missing, use `agentskills` and say so. Do not ask. If the name exists in both `instructions/` and `skills/`, ask which one is meant.

## Target files

| Framework | Instructions file (relative to destination) |
| --- | --- |
| agentskills (default) | `AGENTS.md` |
| codex | `AGENTS.md` |
| opencode | `AGENTS.md` |
| cursor | `AGENTS.md` |
| claude | `CLAUDE.md` |
| gemini | `GEMINI.md` |
| copilot | `.github/copilot-instructions.md` |

If the user names an exact file, use it. If the framework is not listed, say so and ask for the file rather than guessing. Create the file (and parent folder) if it does not exist.

## Source content

- **Instruction set:** the source is `instructions/<name>/`. Its content is `INSTRUCTIONS.md` (or, if absent, the single `.md` file in the folder). If the folder holds several instruction files, treat them as one set in filename order.
- **Skill:** the source is `skills/<name>/SKILL.md`. Its content is the body after the frontmatter, under a heading built from the skill `name`, followed by the `description` as a one-line summary. If the skill has `references/`, `scripts/`, or other files the body relies on, tell the user that those files will not be carried into the instructions file and offer `install-skill` as the alternative. Continue only if they still want the inline version.

The repo root is the directory above `.agents/`. If the source does not exist, list the available instruction sets and skills and stop.

## Marker

Wrap installed content so it can be found again:

```md
<!-- installed-instructions: <kind>/<name> -->
...content...
<!-- /installed-instructions: <kind>/<name> -->
```

`<kind>` is `instructions` or `skills`.

## Workflow

1. **Find the source** and read its content as described above.
2. **Find the target file** for the framework and read it if it exists.
3. **Look for similar instructions** in the target file. Treat any of these as a match:
   - An existing marker block for the same `<kind>/<name>`.
   - A heading matching the source's title or name (ignoring case, punctuation, and heading level).
   - Substantial overlap in content: several of the source's distinctive rules, rule IDs, or sentences appear in the file, even under a different heading.

   Judge near misses. A file that only mentions the same topic in passing is not a match. If unsure, treat it as a match and say why.
4. **No match: append.** Add a blank line, then the marked block with the source content verbatim, to the end of the target file. Do not alter existing text. Go to step 7.
5. **Match: diff, do not change anything.** Identify the matching section in the target file and compare it with the source content. Do not edit the target file in this step. Present:
   - Where the existing section is (file and heading or line range) and how it was matched.
   - A summary of the differences: rules or sections only in the source, only in the target, and reworded or changed ones. Quote short snippets for important changes. State when the two are identical, and in that case report that nothing needs to change and stop.
   - A recommendation of **overwrite** (replace the existing section with the source, discarding local differences) or **merge** (keep local additions and bring in the source's new or changed rules), with a sentence of reasoning. Prefer merge when the target has local content the source lacks, and overwrite when the target is simply an older copy.
6. **Await approval.** Stop and wait for the user to choose overwrite, merge, or leave as is. Do not change the file before they answer. After approval:
   - **Overwrite:** replace only the matched section with the marked block of source content.
   - **Merge:** produce the combined section, show it if the merge involved any judgment calls, and apply it inside a marked block.
7. **Verify.** Re-read the target file and confirm the block is present once, the surrounding content is unchanged, and the file is well formed.
8. **Report.** State what was installed or changed, in which file, which framework layout was used (and that it was the default if the user did not choose), and that some agents need a restart or reload to pick up changed instructions.
