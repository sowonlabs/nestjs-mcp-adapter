import { Module, DynamicModule, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MultiServerRegistry } from './registry/multi-server-registry';
import { McpToolHandler } from './handlers/mcp-tool-handler';

/**
 * MCP adapter module
 * Provides MCP server functionality in a NestJS application.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [MultiServerRegistry, McpToolHandler],
  exports: [MultiServerRegistry, McpToolHandler],
})
export class McpAdapterModule {
  /**
   * Register as a global module
   */
  static forRoot(): DynamicModule {
    return {
      module: McpAdapterModule,
      global: true,
      providers: [
        MultiServerRegistry,
        McpToolHandler,
      ],
      exports: [
        MultiServerRegistry,
        McpToolHandler,
      ],
    };
  }
}
