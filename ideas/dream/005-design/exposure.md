# Design: Exposure

**Layer:** 005, Technical design
**Status:** Draft

This file defines how [exposure](../003-process/exposure.md) makes published outputs available to agents on every supported platform. Exposure reads Approve's namespace for outputs and the tags of work from Collect's and Analyze's namespaces, keeps its own bookkeeping in a namespace of its own through the [storage interface](storage.md), and runs its writing job in the [runtime host](runtime.md).

---

## Ways agents reach outputs

| Way | What it is | Who uses it |
|---|---|---|
| **Managed files** | Files that Exposure writes where each platform loads knowledge automatically. | Every session on a supported platform, without asking. |
| **MCP server** | The exposure process, which an agent starts over stdio, with read-only tools. | An agent that asks for outputs while it works. |

Both offer only the current versions of published outputs (EXP-1, EXP-5), and both give each output with the origin of each applied scope through which it reached the work (EXP-3).

## Which outputs cover which work

An applied scope covers a piece of work when the work carries the same tag (layer 004, covers). Exposure reads the tags of work from two places: the tags in record metadata, such as the repository, from Collect's namespace, and the tags that need judgment, such as a language or an engineering domain, from Analyze's namespace. A scope of general knowledge covers all work. Exposure never writes to either namespace.

## Managed files

For each project, Exposure writes the current memory and practices whose applied scopes cover the project, and the current skills that reach it, into the places each platform loads them from. The places are set in the configuration, and the places known so far are the following.

| Platform | Project places | User-level places |
|---|---|---|
| **Claude Code** | `.claude/rules/` and the project's skill directory. | The user's Claude Code rules and skill directory. |
| **Cursor** | `.cursor/rules/`. | The user's Cursor rules. |
| **Codex** | A marked Archon section of the project's `AGENTS.md`. | A marked Archon section of the user's `AGENTS.md`. |

Outputs whose scopes cover all of the user's work, or all software work, go to the user-level places. Every managed file states that Archon manages it, and each output in it is labeled with its output ID, its version ID, and its origin.

Every managed file inside a repository is listed in the repository's `.git/info/exclude`, so it stays local to the machine and is never committed. Exposure does not change the repository's `.gitignore`.

Each managed file has a size cap set in the configuration. Outputs that do not fit under the cap are left out of the file and stay available through the MCP server.

## Published-outputs directory

Exposure writes every current output to a published-outputs directory in the Archon data directory, one file for each output. Each file holds the output's content and is labeled with its output ID, its version ID, its kind, and its applied scopes with the origin of each. The directory holds exactly the outputs that the MCP server serves, so it shows everything that agents can load through the MCP server, including outputs left out of managed files by a size cap.

## MCP server

The MCP server runs as the exposure process that an agent starts, and it opens only read handles (RUN-1). It offers three tools.

- **List** returns the current outputs whose applied scopes cover the agent's working directory, each with its origins.
- **Get** returns one current output by ID.
- **Search** returns current outputs that match a query, ranked by text match and similarity.

Every published output can be reached through the MCP server on every supported platform (PLT-3). The MCP server changes nothing in Archon (EXP-4).

## Exposure job

A job in the service writes every managed file and every piece of approved existing knowledge. It starts when Approve's namespace has new writes, or when the tags of work change in Collect's or Analyze's namespace.

- **Managed files.** The job regenerates every managed file whose content changes, and it removes managed files that no longer hold any output.
- **Published outputs.** The job writes the file of every output whose current version changes, and it removes the file of every output that no longer has a current version.
- **Existing knowledge.** When the current version of an existing-knowledge output is one that Approve made current, the job writes its content to the output's location. Before it writes, it checks that the file still holds the version being replaced. When the file holds something else, the job skips the write, and Collect's record of the hand edit makes that edit the current version, as [Approve](approve.md) defines it.

Exposure's namespace records what the job wrote, where, and from which version, so no write is repeated and every managed file can be found and cleaned up.

## Loop back to Collect

Managed files, the published-outputs directory, and rewritten existing knowledge are places agents load knowledge from, so Collect records them as existing knowledge (COL-7). The labels in managed files and in the published-outputs directory show which version of which output agents load. Analyze learns what is published from those records and never from Exposure or Approve (SEP-4).

---

## Technical requirements

**EXD-1. Agents are offered only current versions.** This serves EXP-1 and EXP-5.

- No managed file holds a superseded version, a retired output, or any internal knowledge.
- The MCP server returns only current versions of published outputs.

**EXD-2. An output reaches only the work its applied scopes cover.** This serves EXP-2.

- No managed file in a project holds an output whose applied scopes do not cover that project.
- The list tool returns only outputs whose applied scopes cover the agent's working directory.

**EXD-3. Every output is given with its origins.** This serves EXP-3.

- Every output in a managed file and every output the MCP server returns carries the origin of each applied scope through which it reached the work.

**EXD-4. Every supported platform reaches every published output.** This serves PLT-3.

- Every current output can be fetched through the MCP server from each supported platform.
- For the same project, the managed files of every supported platform are generated from the same current versions.

**EXD-5. Exposure never overwrites a hand edit.** This serves APR-6 and COL-7.

- The exposure job writes existing knowledge only when the file still holds the version being replaced.

**EXD-6. Every publication is recorded from where agents load it.** This serves COL-7 and SEP-4.

- After the exposure job runs, the published-outputs directory holds one file for each current output and no other file.
- Every output in a managed file and in the published-outputs directory is labeled with its output ID and version ID.