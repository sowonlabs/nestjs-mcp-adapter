import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { ServerRegistry } from './server-registry';
import { MCP_TOOL_METADATA_KEY, MCP_RESOURCE_METADATA_KEY } from '../decorators/constants';
import { McpToolOptions } from '../decorators/mcp-tool.decorator';
import { McpResourceOptions } from '../decorators/mcp-resource.decorator';

/**
 * 다중 서버 레지스트리
 * 여러 MCP 서버를 관리합니다.
 */
@Injectable()
export class MultiServerRegistry implements OnModuleInit {
  private readonly logger:Logger = new Logger(MultiServerRegistry.name);
  private readonly servers = new Map<string, ServerRegistry>();
  
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef,
  ) {}
  
  /**
   * 모듈 초기화시 도구와 리소스를 자동 등록
   */
  async onModuleInit() {
    await this.discoverAndRegisterTools();
    await this.discoverAndRegisterResources();
    this.logger.log('servers:', this.servers);
  }
  
  /**
   * 서버 레지스트리 가져오기
   * 없으면 새로 생성
   */
  getServerRegistry(serverName: string): ServerRegistry {
    if (!this.servers.has(serverName)) {
      this.servers.set(serverName, new ServerRegistry());
    }
    return this.servers.get(serverName)!;
  }
  
  /**
   * 모든 서버 이름 가져오기
   */
  getServerNames(): string[] {
    return Array.from(this.servers.keys());
  }
  
  /**
   * @McpTool 데코레이터를 사용한 도구 발견 및 등록
   */
  private async discoverAndRegisterTools() {
    const providers = this.discoveryService.getProviders();
    
    await Promise.all(
      providers
        .filter((wrapper) => wrapper.instance && Object.getPrototypeOf(wrapper.instance))
        .map(async (wrapper) => {
          const { instance } = wrapper;
          const prototype = Object.getPrototypeOf(instance);
          
          this.metadataScanner.scanFromPrototype(
            instance,
            prototype,
            (methodName) => {
              const methodRef = instance[methodName];
              const metadata = Reflect.getMetadata(MCP_TOOL_METADATA_KEY, methodRef);
              
              if (metadata) {
                const toolOptions = metadata as McpToolOptions;
                const serverNames = Array.isArray(toolOptions.server) 
                  ? toolOptions.server 
                  : [toolOptions.server];
                const toolName = toolOptions.name;
                
                // 각 서버에 도구 등록
                for (const serverName of serverNames) {
                  const serverRegistry = this.getServerRegistry(serverName);
                  serverRegistry.registerTool(toolName, toolOptions, methodRef.bind(instance));
                }
              }
            },
          );
        }),
    );
  }
  
  /**
   * @McpResource 데코레이터를 사용한 리소스 발견 및 등록
   */
  private async discoverAndRegisterResources() {
    const providers = this.discoveryService.getProviders();
    
    await Promise.all(
      providers
        .filter((wrapper) => wrapper.instance && Object.getPrototypeOf(wrapper.instance))
        .map(async (wrapper) => {
          const { instance } = wrapper;
          const prototype = Object.getPrototypeOf(instance);
          
          this.metadataScanner.scanFromPrototype(
            instance,
            prototype,
            (methodName) => {
              const methodRef = instance[methodName];
              const metadata = Reflect.getMetadata(MCP_RESOURCE_METADATA_KEY, methodRef);
              
              if (metadata) {
                const resourceOptions = metadata as McpResourceOptions;
                const serverNames = Array.isArray(resourceOptions.server) 
                  ? resourceOptions.server 
                  : [resourceOptions.server];
                const resourceUri = resourceOptions.uri;
                
                // 각 서버에 리소스 등록
                for (const serverName of serverNames) {
                  const serverRegistry = this.getServerRegistry(serverName);
                  serverRegistry.registerResource(resourceUri, resourceOptions, methodRef.bind(instance));
                }
              }
            },
          );
        }),
    );
  }
}
