Multi-session pattern discovery
Offline task replay
automatic skill discovery
Evidence based memory validation
cross-agent learning(turnlog)
hierarchical context aware memory

memory proposal to live promotion

Experience collection: Capture sessions, tools, commands, changes, tests, corrections and outcomes across all agents.
Reflection: Discover patterns, repeated failures and successful approaches. Preserve references to original evidence.
Knowledge synthesis: Produce project knowledge, architectural decisions, coding conventions, and candidate skills.
Experimental evaluation: Replay historical tasks and run held-out tests to determine whether candidate improvements actually help.
Governed promotion: Version improvements, require appropriate approvals, and support rollback when behavior regresses.

operate on execution trajectories, not just conversation transcripts.
Tests, diffs, tool outputs and human corrections provide stronger evidence of what actually happened.

Level	Learning outcome	Automation
Memory	What does the agent know?	High
Practices	How should the agent approach work?	Medium, with verification
Skills	What reusable capabilities should the agent acquire or modify?	Evaluation-gated


Orient
Read existing memory files, understand their organization, and identify the sessions that haven't been processed.

Gather signal
Search session transcripts for durable information: decisions, user corrections, preferences, architectural lessons, recurring patterns, and unfinished work.

Consolidate
Compare new findings against existing knowledge. Merge duplicates, resolve contradictions, update outdated information, and preserve useful context.

Prune and index
Remove obsolete information, organize detailed memories into topic files, and maintain a compact index that future agents can load efficiently.


Compact Memory navigation index
architecture
conventions
lessons
preferences
open work
dream state

Transcript collection separate from dream mechanism

distinction between descriptive knowledge (how the project currently works) and prescriptive knowledge (how agents should work on it).

Identify questions to ask to learn from user input when unsure based on transcript history

Script based first, LLM judgement and summarization. Don't use LLM unless necessary.

Maintain historical memories and changes to memory.

https://github.com/microsoft/skillopt/blob/main/plugins/claude-code/skills/skillopt-sleep/SKILL.md

project memory vs global memory. Global memories are not always loaded for all proejct, but can be applied per project when relevant during the dream cycle.
Manual memory injection or suggestions. Maintained in raw format. Applied when generating/proposing 
