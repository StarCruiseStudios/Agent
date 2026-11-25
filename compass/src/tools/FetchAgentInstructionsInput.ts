import { z } from 'zod';
import { ProjectRootField } from './ProjectRootField.ts';

/**
 * Input for `fetch_agent_instructions`. Name rules are checked by the catalog, before filesystem access.
 */
export const FetchAgentInstructionsInput = z.strictObject({
  /**
   * Explicit absolute root; when omitted, the launch `--project-root` default is used.
   */
  projectRoot: ProjectRootField,
  /**
   * Exact case-sensitive agent name.
   */
  name: z.string().describe('Exact agent name, as assigned or as returned by list_agents.'),
});
