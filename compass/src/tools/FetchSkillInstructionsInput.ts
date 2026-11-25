import { z } from 'zod';

export const FetchSkillInstructionsInput = z.strictObject({
  projectRoot: z.string().optional().describe('Absolute project root; includes recursively referenced Compass directories. Overrides the launch --project-root. Required unless the server was launched with --project-root.'),
  agentName: z.string().describe('Exact agent name; skills belong exclusively to the selected agent.'),
  skillName: z.string().describe('Exact skill name returned in that agent’s details, not a path.'),
});
