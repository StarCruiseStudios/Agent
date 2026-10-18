import { McpServer } from '@modelcontextprotocol/server';
import type { ListAgentsTool } from '../tools/ListAgentsTool.ts';
import type { FetchAgentInstructionsTool } from '../tools/FetchAgentInstructionsTool.ts';
import { ListAgentsInput } from '../tools/ListAgentsInput.ts';
import { FetchAgentInstructionsInput } from '../tools/FetchAgentInstructionsInput.ts';

/**
 * Registers only the two read-only Compass tools on each server instance.
 */
export class CompassMcpServer {
  private readonly list: ListAgentsTool;
  private readonly fetch: FetchAgentInstructionsTool;
  constructor(list: ListAgentsTool, fetch: FetchAgentInstructionsTool) { this.list = list; this.fetch = fetch; }

  build(): McpServer {
    const server = new McpServer({ name: 'compass', version: '0.1.0' });
    const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
    server.registerTool('list_agents', {
      description: 'Call at the start of every new task or delegated subtask, before planning or working, to discover applicable instruction packs. Select by description and whenToUse, then fetch the selected pack. If already assigned a pack, fetch it directly; if none applies, continue the task.',
      inputSchema: ListAgentsInput,
      annotations,
    }, input => this.list.execute(input));
    server.registerTool('fetch_agent_instructions', {
      description: 'Call before working on a task when a pack was assigned or selected from list_agents. Read and apply its full instructions; list summaries are insufficient. If no pack is known, call list_agents first.',
      inputSchema: FetchAgentInstructionsInput,
      annotations,
    }, input => this.fetch.execute(input));
    return server;
  }
}
