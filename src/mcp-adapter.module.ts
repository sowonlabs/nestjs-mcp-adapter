import { Module, DynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MultiServerRegistry } from './registry/multi-server-registry';
import { McpHandler } from './handlers/mcp-handler';

/**
 * MCP adapter module
 * Provides MCP server functionality in a NestJS application.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [
    MultiServerRegistry, 
    McpHandler
  ],
  exports: [MultiServerRegistry, McpHandler],
})
export class McpAdapterModule {
  /**
   * Register as a global module
   */
  static forRoot(): DynamicModule {
    return {
      module: McpAdapterModule,
      global: true,
      imports: [DiscoveryModule],
      providers: [
        MultiServerRegistry,
        McpHandler
      ],
      exports: [
        MultiServerRegistry,
        McpHandler,
      ],
    };
  }
}
