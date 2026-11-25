import { z } from 'zod';

/**
 * The optional `projectRoot` argument shared by every tool.
 */
export const ProjectRootField = z.string().optional().describe(
  'Absolute project root. Omit it when the server was launched with --project-root; a value here overrides that default.');
