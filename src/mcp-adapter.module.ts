import { Module, DynamicModule, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MultiServerRegistry } from '@registry/multi-server-registry';
import { McpHandler } from '@handlers/mcp-handler';
import { McpModuleOptions } from '@interfaces';
import { MCP_MODULE_OPTIONS } from '@decorators/constants';

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
  static forRoot(options?: McpModuleOptions): DynamicModule {
    const providers: Provider[] = [
      MultiServerRegistry,
      McpHandler,
      {
        provide: MCP_MODULE_OPTIONS,
        useValue: options || {},
      },
    ];

    return {
      module: McpAdapterModule,
      global: true,
      imports: [DiscoveryModule],
      providers: providers,
      exports: [MultiServerRegistry, McpHandler],
    };
  }
}
