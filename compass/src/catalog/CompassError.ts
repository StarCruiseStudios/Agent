/**
 * A catalog failure that tool handlers translate into an MCP tool error.
 */
export class CompassError extends Error {
  readonly code: 'invalid_project_root' | 'invalid_name' | 'path_escape' | 'catalog_missing' |
    'unknown_agent' | 'malformed_pack' | 'case_collision';

  constructor(code: CompassError['code'], message: string) {
    super(message);
    this.code = code;
  }
}
