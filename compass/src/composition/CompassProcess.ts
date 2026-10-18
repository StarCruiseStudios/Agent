import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { NodeFileSystem } from '../filesystem/NodeFileSystem.ts';
import { TslogDiagnosticLogger } from '../logging/TslogDiagnosticLogger.ts';
import { ProjectRootResolver } from '../catalog/ProjectRootResolver.ts';
import { CompassPathGuard } from '../catalog/CompassPathGuard.ts';
import { AgentPackParser } from '../catalog/AgentPackParser.ts';
import { AgentCatalog } from '../catalog/AgentCatalog.ts';
import { ToolResultFactory } from '../tools/ToolResultFactory.ts';
import { ListAgentsTool } from '../tools/ListAgentsTool.ts';
import { FetchAgentInstructionsTool } from '../tools/FetchAgentInstructionsTool.ts';
import { CompassMcpServer } from '../server/CompassMcpServer.ts';

/**
 * Composition root and sole owner of stdio serving.
 */
export class CompassProcess {
  start(): ReturnType<typeof serveStdio> {
    const logger = TslogDiagnosticLogger.create();
    const fs = new NodeFileSystem();
    const catalog = new AgentCatalog(fs, new ProjectRootResolver(fs), new CompassPathGuard(fs),
      new AgentPackParser(fs), logger);
    const results = new ToolResultFactory(logger);
    const server = new CompassMcpServer(new ListAgentsTool(catalog, results), new FetchAgentInstructionsTool(catalog, results));
    return serveStdio(() => server.build());
  }
}
