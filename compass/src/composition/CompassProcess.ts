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
import { FetchSkillInstructionsTool } from '../tools/FetchSkillInstructionsTool.ts';
import { CompassMcpServer } from '../server/CompassMcpServer.ts';
import { LaunchArguments, LaunchUsageError } from './LaunchArguments.ts';

/**
 * Composition root and sole owner of stdio serving.
 */
export class CompassProcess {
  private readonly args: readonly string[];
  private readonly cwd: string;
  constructor(args: readonly string[] = [], cwd: string = process.cwd()) { this.args = args; this.cwd = cwd; }

  /**
   * Parses launch arguments and validates the default root before serving.
   * Failures are reported on stderr (stdout is reserved for MCP) with a non-zero exit code.
   */
  async start(): Promise<ReturnType<typeof serveStdio> | undefined> {
    const logger = TslogDiagnosticLogger.create();
    const fs = new NodeFileSystem();
    let resolver = new ProjectRootResolver(fs);
    try {
      const launch = LaunchArguments.parse(this.args);
      if (launch.projectRoot !== undefined) {
        resolver = new ProjectRootResolver(fs, await resolver.resolveLaunchRoot(launch.projectRoot, this.cwd));
      }
    } catch (error) {
      const usage = error instanceof LaunchUsageError;
      process.stderr.write(`compass: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = usage ? 2 : 1;
      return undefined;
    }
    const catalog = new AgentCatalog(fs, resolver, new CompassPathGuard(fs), new AgentPackParser(fs), logger);
    const results = new ToolResultFactory(logger);
    const server = new CompassMcpServer(new ListAgentsTool(catalog, results), new FetchAgentInstructionsTool(catalog, results),
      new FetchSkillInstructionsTool(catalog, results));
    return serveStdio(() => server.build());
  }
}
