import { CatalogTool } from './CatalogTool.ts';
import { FetchSkillInstructionsInput } from './FetchSkillInstructionsInput.ts';

/**
 * `fetch_skill_instructions`: one skill body of one agent, as Markdown plus its metadata.
 */
export class FetchSkillInstructionsTool extends CatalogTool<typeof FetchSkillInstructionsInput> {
  readonly input = FetchSkillInstructionsInput;
  protected async run(input: typeof FetchSkillInstructionsInput._output) {
    return this.results.document(await this.catalog.fetchSkill(input.projectRoot, input.agentName, input.skillName));
  }
}
