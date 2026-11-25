import { z } from 'zod';
import { ProjectRootField } from './ProjectRootField.ts';

/**
 * Input for `fetch_resource_path`. Resource names are scoped to their agent.
 */
export const FetchResourcePathInput = z.strictObject({
  /**
   * Explicit absolute root; when omitted, the launch `--project-root` default is used.
   */
  projectRoot: ProjectRootField,
  /**
   * Exact name of the agent that owns the resource.
   */
  agentName: z.string().describe('Exact name of the agent that owns the resource.'),
  /**
   * File name (with extension) named by that agent's instructions or skills.
   */
  resourceName: z.string().describe('File name, with extension, named by that agent’s instructions or skills; not a path.'),
});
