import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { ServerRegistry } from './server-registry';
import { MCP_TOOL_METADATA_KEY, MCP_RESOURCE_METADATA_KEY } from '../decorators/constants';
import { McpToolOptions } from '../decorators/mcp-tool.decorator';
import { McpResourceOptions } from '../decorators/mcp-resource.decorator';

/**
 * Multi-server registry
 * Manages multiple MCP servers.
 */
@Injectable()
export class MultiServerRegistry implements OnApplicationBootstrap {
  private readonly logger:Logger = new Logger(MultiServerRegistry.name);
  private readonly servers = new Map<string, ServerRegistry>();
  
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner
  ) {}
  
  /**
   * Automatically register tools and resources
   */
  async onApplicationBootstrap() {
    this.logger.debug('MultiServerRegistry.onApplicationBootstrap');
    await this.discoverAndRegisterTools();
    await this.discoverAndRegisterResources();
    // this.logger.debug('servers:', this.servers);
  }
  
  /**
   * Get server registry
   * Create if not exists
   */
  getServerRegistry(serverName: string): ServerRegistry {
    if (!this.servers.has(serverName)) {
      this.servers.set(serverName, new ServerRegistry());
    }
    return this.servers.get(serverName)!;
  }
  
  /**
   * Get all server names
   */
  getServerNames(): string[] {
    return Array.from(this.servers.keys());
  }
  
  /**
   * Discover and register tools using @McpTool decorator
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
                const toolOptions = metadata as McpToolOptions<any>;
                const serverNames = Array.isArray(toolOptions.server) 
                  ? toolOptions.server 
                  : [toolOptions.server];
                const toolName = toolOptions.name;
                
                // Register tool for each server
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
   * Discover and register resources using @McpResource decorator
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
                
                // Register resource for each server
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
