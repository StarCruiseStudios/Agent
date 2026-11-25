import { CatalogTool } from './CatalogTool.ts';
import { FetchScriptPathInput } from './FetchScriptPathInput.ts';

/**
 * `fetch_script_path`: the real path of one named script file; the script is never read or run.
 */
export class FetchScriptPathTool extends CatalogTool<typeof FetchScriptPathInput> {
  readonly input = FetchScriptPathInput;
  protected async run(input: typeof FetchScriptPathInput._output) {
    return this.results.success(await this.catalog.fetchScriptPath(input.projectRoot, input.agentName, input.scriptName));
  }
}
