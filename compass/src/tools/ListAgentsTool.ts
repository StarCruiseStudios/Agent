import type { AgentCatalog } from '../catalog/AgentCatalog.ts';
import { CompassError } from '../catalog/CompassError.ts';
import { ListAgentsInput } from './ListAgentsInput.ts';
import type { ToolResultFactory } from './ToolResultFactory.ts';

/**
 * Parses list requests and converts all failures to tool results.
 */
export class ListAgentsTool {
  private readonly catalog: AgentCatalog;
  private readonly results: ToolResultFactory;
  constructor(catalog: AgentCatalog, results: ToolResultFactory) { this.catalog = catalog; this.results = results; }

  async execute(input: unknown) {
    try {
      const parsed = ListAgentsInput.safeParse(input);
      if (!parsed.success) throw new CompassError('invalid_project_root', 'The input must contain an explicit absolute projectRoot and no unknown fields.');
      return this.results.success(await this.catalog.list(parsed.data.projectRoot));
    } catch (error) { return this.results.failure(error); }
  }
}
