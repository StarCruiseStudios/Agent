import { McpServer } from '@modelcontextprotocol/server';
import type { ListAgentsTool } from '../tools/ListAgentsTool.ts';
import type { FetchAgentInstructionsTool } from '../tools/FetchAgentInstructionsTool.ts';
import { ListAgentsInput } from '../tools/ListAgentsInput.ts';
import { FetchAgentInstructionsInput } from '../tools/FetchAgentInstructionsInput.ts';
import { FetchSkillInstructionsInput } from '../tools/FetchSkillInstructionsInput.ts';
import type { FetchSkillInstructionsTool } from '../tools/FetchSkillInstructionsTool.ts';

/**
 * Registers the three read-only Compass tools on each server instance.
 */
export class CompassMcpServer {
  private readonly list: ListAgentsTool;
  private readonly fetch: FetchAgentInstructionsTool;
  private readonly fetchSkill: FetchSkillInstructionsTool;
  constructor(list: ListAgentsTool, fetch: FetchAgentInstructionsTool,
    fetchSkill: FetchSkillInstructionsTool) { this.list = list; this.fetch = fetch; this.fetchSkill = fetchSkill; }

  build(): McpServer {
    const server = new McpServer({ name: 'compass', version: '0.1.0' });
    const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
    server.registerTool('list_agents', {
      description: 'Call at the start of every new task or delegated subtask, before planning or working, to discover applicable instruction packs. Select by description and whenToUse, then fetch the selected pack. If already assigned a pack, fetch it directly; if none applies, continue the task.',
      inputSchema: ListAgentsInput,
      annotations,
    }, input => this.list.execute(input));
    server.registerTool('fetch_agent_instructions', {
      description: 'Fetch agent details and full instructions, including available skill names and descriptions. Call before working when a pack was assigned or selected from list_agents. Fetch applicable skill bodies with fetch_skill_instructions.',
      inputSchema: FetchAgentInstructionsInput,
      annotations,
    }, input => this.fetch.execute(input));
    server.registerTool('fetch_skill_instructions', {
      description: 'Fetch the full instructions for one skill belonging to a specific agent. Use the agent name and a skill name returned by fetch_agent_instructions.',
      inputSchema: FetchSkillInstructionsInput,
      annotations,
    }, input => this.fetchSkill.execute(input));
    return server;
  }
}
