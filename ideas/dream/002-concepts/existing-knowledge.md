# Concept: Existing knowledge

**Layer:** 002, Concepts
**Status:** Proposed

Existing knowledge is what agents load, as it is found where agents load it. It includes hand-written instructions, agents' built-in memory, and existing skills, and it also includes the outputs that Archon has published. Archon treats all of it as [outputs](output.md) that are already published (principle 13), so it is subject to the same rules as any other output.

Each piece of existing knowledge has an author: the user, an agent, or unknown. Deciding who wrote a piece is an [inference](inference.md), so it carries its own evidence and can be revised. Whoever wrote it, existing knowledge is never [user input](user-input.md), because user input comes only from what the user states in a session and what the user gives Archon directly. What a piece of existing knowledge states is a [claim](claim.md), and it needs evidence like any other, such as records of the code base it describes.

## Sameness

A piece of existing knowledge whose content changes is the same output with a new version.
