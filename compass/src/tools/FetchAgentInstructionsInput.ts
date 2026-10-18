import { z } from 'zod';

/**
 * Fetch input keeps name validation in the handler, before filesystem access.
 */
export const FetchAgentInstructionsInput = z.strictObject({
  /**
   * Single case-sensitive pack directory name.
   */
  name: z.string().describe('Exact case-sensitive pack name assigned or returned by list_agents; a directory name, not a path.'),
  /**
   * Explicit absolute root; omission returns invalid_project_root.
   */
  projectRoot: z.string().optional().describe('Absolute root of the project being worked on; reads only <projectRoot>/.compass. Required for success; no cwd default or parent search.'),
});
