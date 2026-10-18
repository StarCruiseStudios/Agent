import { z } from 'zod';

export const FetchSkillInstructionsInput = z.strictObject({
  projectRoot: z.string().optional().describe('Explicit absolute project root; includes recursively referenced Compass directories.'),
  agentName: z.string().describe('Exact agent name; skills belong exclusively to the selected agent.'),
  skillName: z.string().describe('Exact skill name returned in that agent’s details, not a path.'),
});
