/**
 * A catalog failure that tool handlers translate into an MCP tool error.
 */
export class CompassError extends Error {
  /**
   * Stable error code returned to callers as `error`.
   */
  readonly code: 'invalid_input' | 'invalid_project_root' | 'invalid_name' | 'path_escape' | 'catalog_missing' |
    'catalog_unreadable' | 'unknown_agent' | 'malformed_pack' | 'case_collision' | 'unknown_skill' | 'malformed_skill' |
    'unknown_resource' | 'unknown_script' | 'internal_error';

  /**
   * Parse token for `malformed_pack` and `malformed_skill` (for example `missing_metadata`).
   */
  readonly reason: string | undefined;

  /**
   * Extra structured fields returned alongside `error` and `message`, such as `name` or `suggestions`.
   */
  readonly details: Readonly<Record<string, unknown>>;

  constructor(code: CompassError['code'], message: string,
    options: { reason?: string; details?: Record<string, unknown> } = {}) {
    super(message);
    this.code = code;
    this.reason = options.reason;
    this.details = options.details ?? {};
  }

  /**
   * Returns a copy of this error with additional structured details.
   */
  with(details: Record<string, unknown>): CompassError {
    return new CompassError(this.code, this.message, { reason: this.reason, details: { ...this.details, ...details } });
  }
}
