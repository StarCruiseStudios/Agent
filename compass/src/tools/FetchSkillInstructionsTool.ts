import type { AgentCatalog } from '../catalog/AgentCatalog.ts';
import { CompassError } from '../catalog/CompassError.ts';
import { FetchSkillInstructionsInput } from './FetchSkillInstructionsInput.ts';
import type { ToolResultFactory } from './ToolResultFactory.ts';

export class FetchSkillInstructionsTool {
  private readonly catalog: AgentCatalog;
  private readonly results: ToolResultFactory;
  constructor(catalog: AgentCatalog, results: ToolResultFactory) { this.catalog = catalog; this.results = results; }

  async execute(input: unknown) {
    try {
      const parsed = FetchSkillInstructionsInput.safeParse(input);
      if (!parsed.success) {
        const namesPresent = typeof input === 'object' && input !== null &&
          'agentName' in input && typeof input.agentName === 'string' &&
          'skillName' in input && typeof input.skillName === 'string';
        throw new CompassError(namesPresent ? 'invalid_project_root' : 'invalid_name',
          'Provide agentName, skillName and an explicit absolute projectRoot, with no unknown fields.');
      }
      return this.results.success(await this.catalog.fetchSkill(parsed.data.projectRoot, parsed.data.agentName, parsed.data.skillName));
    } catch (error) { return this.results.failure(error); }
  }
}
