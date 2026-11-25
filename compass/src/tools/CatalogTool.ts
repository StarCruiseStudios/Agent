import type { CallToolResult, StandardSchemaWithJSON } from '@modelcontextprotocol/server';
import type { z } from 'zod';
import type { AgentCatalog } from '../catalog/AgentCatalog.ts';
import { CompassError } from '../catalog/CompassError.ts';
import type { ToolResultFactory } from './ToolResultFactory.ts';

/**
 * Shared tool handler: validates raw arguments itself and converts every failure into a Compass error
 * result, so bad input gets the same `{ error, message }` shape as every other failure.
 */
export abstract class CatalogTool<Input extends z.ZodType> {
  protected readonly catalog: AgentCatalog;
  protected readonly results: ToolResultFactory;
  constructor(catalog: AgentCatalog, results: ToolResultFactory) { this.catalog = catalog; this.results = results; }

  /**
   * The strict input contract for this tool.
   */
  abstract readonly input: Input;

  /**
   * Runs the tool on validated input.
   */
  protected abstract run(input: z.infer<Input>): Promise<CallToolResult>;

  /**
   * The schema to register with the SDK: it advertises the strict JSON Schema of `input` but accepts any
   * value, leaving validation (and its error shape) to `execute`.
   */
  advertisedSchema(): StandardSchemaWithJSON {
    const standard = this.input['~standard'] as StandardSchemaWithJSON['~standard'];
    return { '~standard': { ...standard, validate: (value: unknown) => ({ value }) } } as StandardSchemaWithJSON;
  }

  async execute(input: unknown): Promise<CallToolResult> {
    try {
      const parsed = this.input.safeParse(input ?? {});
      if (!parsed.success) {
        const issues = parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }));
        throw new CompassError('invalid_input',
          `The arguments do not match this tool's input schema: ${issues.map(issue => issue.path ? `${issue.path}: ${issue.message}` : issue.message).join('; ')}.`,
          { details: { issues } });
      }
      return await this.run(parsed.data);
    } catch (error) { return this.results.failure(error); }
  }
}
