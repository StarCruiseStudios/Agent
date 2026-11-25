/**
 * The single naming rule shared by agent directories, `agent.json` names and skill names.
 */
export class AgentName {
  /**
   * Lowercase letters and digits in hyphen-separated runs, starting with a letter.
   */
  static readonly pattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  /**
   * Maximum name length in characters.
   */
  static readonly maxLength = 64;

  /**
   * Returns whether a value is a valid name, without touching the filesystem.
   */
  static isValid(value: unknown): value is string {
    return typeof value === 'string' && value.length <= AgentName.maxLength && AgentName.pattern.test(value);
  }

  /**
   * Returns the valid name a near-miss most likely meant (for example `Code Review` to `code-review`), if any.
   */
  static normalize(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const candidate = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
    return candidate !== value && AgentName.isValid(candidate) ? candidate : undefined;
  }
}
