import { z } from 'zod';
import { ProjectRootField } from './ProjectRootField.ts';

/**
 * Input for `fetch_skill_instructions`. Skill names are scoped to their agent.
 */
export const FetchSkillInstructionsInput = z.strictObject({
  /**
   * Explicit absolute root; when omitted, the launch `--project-root` default is used.
   */
  projectRoot: ProjectRootField,
  /**
   * Exact name of the agent that owns the skill.
   */
  agentName: z.string().describe('Exact name of the agent that owns the skill.'),
  /**
   * Exact skill name from that agent's `skills` list.
   */
  skillName: z.string().describe('Exact skill name from that agent’s skills list.'),
});
