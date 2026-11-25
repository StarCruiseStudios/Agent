import { CatalogTool } from './CatalogTool.ts';
import { ListAgentsInput } from './ListAgentsInput.ts';

/**
 * `list_agents`: agent summaries plus catalog-wide problems.
 */
export class ListAgentsTool extends CatalogTool<typeof ListAgentsInput> {
  readonly input = ListAgentsInput;
  protected async run(input: typeof ListAgentsInput._output) {
    return this.results.success(await this.catalog.list(input.projectRoot));
  }
}
