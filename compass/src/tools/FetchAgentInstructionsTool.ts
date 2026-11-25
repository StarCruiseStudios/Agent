import { CatalogTool } from './CatalogTool.ts';
import { FetchAgentInstructionsInput } from './FetchAgentInstructionsInput.ts';

/**
 * `fetch_agent_instructions`: one agent's instructions as Markdown, plus its metadata and skill summaries.
 */
export class FetchAgentInstructionsTool extends CatalogTool<typeof FetchAgentInstructionsInput> {
  readonly input = FetchAgentInstructionsInput;
  protected async run(input: typeof FetchAgentInstructionsInput._output) {
    return this.results.document(await this.catalog.fetch(input.projectRoot, input.name));
  }
}
