import type { AgentSummary } from './AgentSummary.ts';

/**
 * A fetched pack, including its complete Markdown body and resolved paths.
 */
export interface AgentInstructions extends AgentSummary {
  /**
   * Canonical absolute project root.
   */
  projectRoot: string;
  /**
   * Catalog path under the resolved project root.
   */
  compassPath: string;
  /**
   * Real absolute directory path of the pack.
   */
  agentPath: string;
  /**
   * Decoded instruction body, with only a leading BOM removed.
   */
  instructions: string;
}
