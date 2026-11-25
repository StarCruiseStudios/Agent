import { CatalogTool } from './CatalogTool.ts';
import { FetchResourcePathInput } from './FetchResourcePathInput.ts';

/**
 * `fetch_resource_path`: the real path of one named resource file; the file is never read.
 */
export class FetchResourcePathTool extends CatalogTool<typeof FetchResourcePathInput> {
  readonly input = FetchResourcePathInput;
  protected async run(input: typeof FetchResourcePathInput._output) {
    return this.results.success(await this.catalog.fetchResourcePath(input.projectRoot, input.agentName, input.resourceName));
  }
}
