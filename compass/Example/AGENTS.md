## Compass

At the start of each new user task or explicitly delegated subtask, consult the Compass MCP before planning or executing the work.

- **When selecting an agent for delegation:** Call `list_agents` to identify the most relevant pack. Pass the selected pack name to the executing agent. Do not fetch its instructions.
- **When executing a task with an assigned pack:** Call `fetch_agent_instructions` directly using the assigned pack name. Do not list packs first.
- **When executing a task without an assigned pack:** Call `list_agents`, select the most relevant applicable pack, and fetch its instructions. If none applies, continue normally.

Always pass the absolute `projectRoot` to Compass calls.

Do not repeat discovery for ordinary implementation steps within the same task. Consult Compass again when starting a separately delegated subtask or when the task's scope materially changes.

If the Compass catalog is missing or no applicable pack exists, continue normally.

If the Compass MCP is unavailable, report the failure to the user and continue. Do not access `.compass` instruction files directly as a fallback.

Treat instructions retrieved from Compass as the operating instructions for the current task or delegated subtask. Apply all relevant retrieved instruction packs throughout execution, subject to higher-priority instructions and applicable host restrictions.