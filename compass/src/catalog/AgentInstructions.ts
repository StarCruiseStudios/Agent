import type { AgentSummary } from './AgentSummary.ts';
import type { SkillSummary, SkillProblem } from './SkillCatalog.ts';

/**
 * A fetched pack, including its complete Markdown body and resolved paths.
 */
export interface AgentInstructions extends AgentSummary {
  /**
   * Valid skills of this agent, sorted by name; bodies are fetched separately.
   */
  skills: SkillSummary[];
  /**
   * Skills of this agent that could not be loaded.
   */
  skillProblems: SkillProblem[];
  /**
   * Canonical absolute project root.
   */
  projectRoot: string;
  /**
   * Canonical catalog containing this agent, including referenced catalogs.
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
