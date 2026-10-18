import type { z } from 'zod';
import type { AgentMetadata } from './AgentMetadata.ts';

/**
 * Validated metadata returned by list without instruction text or an agent path.
 */
export type AgentSummary = z.infer<typeof AgentMetadata>;
