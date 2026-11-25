import { z } from 'zod';
import { ProjectRootField } from './ProjectRootField.ts';

/**
 * Input for `fetch_script_path`. Script names are scoped to their agent.
 */
export const FetchScriptPathInput = z.strictObject({
  /**
   * Explicit absolute root; when omitted, the launch `--project-root` default is used.
   */
  projectRoot: ProjectRootField,
  /**
   * Exact name of the agent that owns the script.
   */
  agentName: z.string().describe('Exact name of the agent that owns the script.'),
  /**
   * File name (with extension) named by that agent's instructions or skills.
   */
  scriptName: z.string().describe('File name, with extension, named by that agent’s instructions or skills; not a path.'),
});
