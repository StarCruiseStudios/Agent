import { z } from 'zod';

/**
 * Tool input; absence remains parseable so handlers can return the domain error.
 */
export const ListAgentsInput = z.strictObject({
  /**
   * Explicit absolute root; omission returns invalid_project_root.
   */
  projectRoot: z.string().optional().describe('Absolute root of the project being worked on; reads only <projectRoot>/.compass. Required for success; no cwd default or parent search.'),
});
