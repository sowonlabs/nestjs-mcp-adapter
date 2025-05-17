import { Module, DynamicModule, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MultiServerRegistry } from './registry/multi-server-registry';
import { McpToolHandler } from './handlers/mcp-tool-handler';

/**
 * MCP 어댑터 모듈
 * NestJS 애플리케이션에서 MCP 서버 기능을 제공합니다.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [MultiServerRegistry, McpToolHandler],
  exports: [MultiServerRegistry, McpToolHandler],
})
export class McpAdapterModule {
  /**
   * 전역 모듈로 등록
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
