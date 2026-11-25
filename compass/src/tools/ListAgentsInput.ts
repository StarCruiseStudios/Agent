import { z } from 'zod';
import { ProjectRootField } from './ProjectRootField.ts';

/**
 * Input for `list_agents`.
 */
export const ListAgentsInput = z.strictObject({
  /**
   * Explicit absolute root; when omitted, the launch `--project-root` default is used.
   */
  projectRoot: ProjectRootField,
});
