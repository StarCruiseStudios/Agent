import { McpServer } from '@modelcontextprotocol/server';
import type { ListAgentsTool } from '../tools/ListAgentsTool.ts';
import type { FetchAgentInstructionsTool } from '../tools/FetchAgentInstructionsTool.ts';
import type { FetchSkillInstructionsTool } from '../tools/FetchSkillInstructionsTool.ts';
import type { FetchResourcePathTool } from '../tools/FetchResourcePathTool.ts';
import type { FetchScriptPathTool } from '../tools/FetchScriptPathTool.ts';
import { ToolOutputs } from '../tools/ToolOutputs.ts';

/**
 * Registers the five read-only Compass tools on each server instance.
 */
export class CompassMcpServer {
  /**
   * Server identity version.
   */
  static readonly version = '0.2.0';

  /**
   * How to use Compass, sent once in the MCP `initialize` result instead of in every tool description.
   */
  static readonly instructions = [
    'Compass serves human-authored instruction packs ("agents") from a project\'s .compass catalog, disclosed progressively:',
    '1. list_agents returns summaries (name, description, whenToUse, modelHint, tools) for choosing a pack. It never returns instructions.',
    '2. fetch_agent_instructions returns the chosen pack\'s instructions plus its skill names and descriptions. Follow the instructions as operating guidance for the task.',
    '3. fetch_skill_instructions returns one skill\'s body. Fetch a skill only when it applies to the current work.',
    '4. fetch_resource_path and fetch_script_path return the absolute path of a file named by the instructions or a skill. Read or run it with your own tools.',
    'An orchestrator may list, choose a pack and a model from modelHint, and pass only the pack name to a subagent. The subagent then fetches the pack itself, because a listing is not the instructions.',
    'Failures return JSON {error, message}. Unknown names include up to three close "suggestions".',
  ].join('\n');

  private readonly list: ListAgentsTool;
  private readonly fetch: FetchAgentInstructionsTool;
  private readonly fetchSkill: FetchSkillInstructionsTool;
  private readonly fetchResource: FetchResourcePathTool;
  private readonly fetchScript: FetchScriptPathTool;
  constructor(list: ListAgentsTool, fetch: FetchAgentInstructionsTool,
    fetchSkill: FetchSkillInstructionsTool, fetchResource: FetchResourcePathTool, fetchScript: FetchScriptPathTool) {
    this.list = list; this.fetch = fetch; this.fetchSkill = fetchSkill;
    this.fetchResource = fetchResource; this.fetchScript = fetchScript;
  }

  build(): McpServer {
    const server = new McpServer({ name: 'compass', version: CompassMcpServer.version },
      { instructions: CompassMcpServer.instructions });
    const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
    server.registerTool('list_agents', {
      description: 'List the instruction packs available for this project, with the name, description, whenToUse, modelHint and tool hints of each. Use it to choose a pack for the current work or for a delegated subagent. Does not return instructions.',
      inputSchema: this.list.advertisedSchema(),
      outputSchema: ToolOutputs.list,
      annotations,
    }, input => this.list.execute(input));
    server.registerTool('fetch_agent_instructions', {
      description: 'Fetch one pack\'s instructions (Markdown) and metadata, including the names and descriptions of its skills.',
      inputSchema: this.fetch.advertisedSchema(),
      outputSchema: ToolOutputs.agent,
      annotations,
    }, input => this.fetch.execute(input));
    server.registerTool('fetch_skill_instructions', {
      description: 'Fetch the instructions (Markdown) of one skill that belongs to a given agent.',
      inputSchema: this.fetchSkill.advertisedSchema(),
      outputSchema: ToolOutputs.skill,
      annotations,
    }, input => this.fetchSkill.execute(input));
    server.registerTool('fetch_resource_path', {
      description: 'Get the absolute path of a resource file, named by an agent\'s instructions or skills, from that agent\'s resources directory. The file is not read.',
      inputSchema: this.fetchResource.advertisedSchema(),
      outputSchema: ToolOutputs.file,
      annotations,
    }, input => this.fetchResource.execute(input));
    server.registerTool('fetch_script_path', {
      description: 'Get the absolute path of a script, named by an agent\'s instructions or skills, from that agent\'s scripts directory. The script is not read or run.',
      inputSchema: this.fetchScript.advertisedSchema(),
      outputSchema: ToolOutputs.file,
      annotations,
    }, input => this.fetchScript.execute(input));
    return server;
  }
}
