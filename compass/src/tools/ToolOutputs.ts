import { z } from 'zod';

const agent = {
  name: z.string(),
  description: z.string(),
  whenToUse: z.string(),
  tools: z.array(z.string()),
  modelHint: z.string(),
};

const problem = z.object({
  name: z.string(),
  path: z.string(),
  reason: z.string(),
  chain: z.array(z.string()).optional(),
});

const location = {
  projectRoot: z.string().describe('Canonical project root used for this call.'),
  compassPath: z.string().describe('Compass directory that holds the agent (or, for list_agents, the project catalog).'),
};

/**
 * Success output schemas advertised for each tool. Error results are not validated against these;
 * they carry `{ error, message, ...details }` instead.
 */
export const ToolOutputs = {
  /**
   * `list_agents` result.
   */
  list: z.object({
    ...location,
    found: z.boolean().describe('Whether <projectRoot>/.compass exists.'),
    agents: z.array(z.object(agent)),
    problems: z.array(problem),
  }),
  /**
   * `fetch_agent_instructions` result.
   */
  agent: z.object({
    ...location,
    ...agent,
    agentPath: z.string(),
    instructions: z.string(),
    skills: z.array(z.object({ name: z.string(), description: z.string() })),
    skillProblems: z.array(z.object({ name: z.string(), path: z.string(), reason: z.string() })),
  }),
  /**
   * `fetch_skill_instructions` result.
   */
  skill: z.object({
    ...location,
    agentPath: z.string(),
    agentName: z.string(),
    name: z.string(),
    description: z.string(),
    skillPath: z.string(),
    instructions: z.string(),
  }),
  /**
   * `fetch_resource_path` and `fetch_script_path` result.
   */
  file: z.object({
    ...location,
    agentPath: z.string(),
    agentName: z.string(),
    name: z.string(),
    path: z.string().describe('Real absolute path of the file; read or run it with the host’s own tools.'),
  }),
};
