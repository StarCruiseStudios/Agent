import type { AgentCatalog } from '../catalog/AgentCatalog.ts';
import { CompassError } from '../catalog/CompassError.ts';
import { FetchAgentInstructionsInput } from './FetchAgentInstructionsInput.ts';
import type { ToolResultFactory } from './ToolResultFactory.ts';

/**
 * Parses fetch requests and returns either a complete pack or an error without a body.
 */
export class FetchAgentInstructionsTool {
  private readonly catalog: AgentCatalog;
  private readonly results: ToolResultFactory;
  constructor(catalog: AgentCatalog, results: ToolResultFactory) { this.catalog = catalog; this.results = results; }

  async execute(input: unknown) {
    try {
      const parsed = FetchAgentInstructionsInput.safeParse(input);
      if (!parsed.success) {
        const invalidRoot = typeof input === 'object' && input !== null && 'name' in input && typeof input.name === 'string';
        throw new CompassError(invalidRoot ? 'invalid_project_root' : 'invalid_name', 'The fetch input must contain a pack name and an explicit absolute projectRoot and no unknown fields.');
      }
      return this.results.success(await this.catalog.fetch(parsed.data.projectRoot, parsed.data.name));
    } catch (error) { return this.results.failure(error); }
  }
}
