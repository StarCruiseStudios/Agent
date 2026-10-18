/**
 * One invalid catalog child, reported without suppressing valid neighbors.
 */
export interface CatalogProblem {
  /**
   * Original directory name.
   */
  name: string;
  /**
   * Absolute lexical child path.
   */
  path: string;
  /**
   * First validation failure, in contract order.
   */
  reason: 'invalid_name' | 'case_collision' | 'path_escape' |
    `malformed_pack:${'unreadable' | 'missing_metadata' | 'invalid_encoding' | 'invalid_metadata' |
    'name_mismatch' | 'missing_instructions' | 'instructions_too_large' | 'empty_instructions'}`;
}
