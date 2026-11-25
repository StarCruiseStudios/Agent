import { z } from 'zod';

/**
 * Tool input; absence remains parseable so handlers can return the domain error.
 */
export const ListAgentsInput = z.strictObject({
  /**
   * Explicit absolute root; omission returns invalid_project_root.
   */
  projectRoot: z.string().optional().describe('Absolute project root; reads its .compass catalog and recursively configured directories. Overrides the launch --project-root. Required unless the server was launched with --project-root; no cwd default or parent search.'),
});
