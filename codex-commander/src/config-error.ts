/**
 * Raised when a composition configuration is invalid.
 */
export class ConfigError extends Error {
  /**
   * @param message - Description of the invalid configuration.
   */
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
