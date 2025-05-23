import { Injectable, Logger, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { ServerRegistry } from './server-registry';
import { MCP_TOOL_METADATA_KEY, MCP_RESOURCE_METADATA_KEY, MCP_PROMPT_METADATA_KEY, MCP_MODULE_OPTIONS } from '../decorators/constants';
import { McpModuleOptions } from '../interfaces';
import { McpToolOptions } from '../decorators/mcp-tool.decorator';
import { McpResourceOptions } from '../decorators/mcp-resource.decorator';
import { McpPromptOptions } from '../decorators/mcp-prompt.decorator';

/**
 * Multi-server registry
 * Manages multiple MCP servers.
 */
@Injectable()
export class MultiServerRegistry implements OnApplicationBootstrap {
  private readonly logger = new Logger(MultiServerRegistry.name);
  private readonly servers = new Map<string, ServerRegistry>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef,
    @Inject(MCP_MODULE_OPTIONS) private readonly options: McpModuleOptions,
  ) {}

  async onApplicationBootstrap() {
    // McpModuleOptions에 정의된 서버들에 대해 ServerRegistry 미리 생성
    if (this.options.servers) {
      for (const serverName in this.options.servers) {
        // eslint-disable-next-line no-prototype-builtins
        if (Object.prototype.hasOwnProperty.call(this.options.servers, serverName)) {
          if (this.servers.has(serverName)) {
            this.logger.warn(`ServerRegistry for server '${serverName}' is already registered. Check your McpModuleOptions for duplicates.`);
          } else {
            this.logger.debug(`Pre-registering ServerRegistry for configured server: ${serverName}`);
            this.servers.set(serverName, new ServerRegistry());
          }
        }
      }
    }

    await this.discoverAndRegisterTools();
    await this.discoverAndRegisterResources();
    await this.discoverAndRegisterPrompts();
  }

  /**
   * Get server registry
   * Throws error if not exists
   */
  getServerRegistry(serverName: string): ServerRegistry {
    const registry = this.servers.get(serverName);
    if (!registry) {
      // This error will be thrown if getServerRegistry is called for a server not defined
      // in McpModuleOptions or for which a tool/resource tries to register implicitly.
      throw new Error(
        `ServerRegistry for server '${serverName}' not found. ` +
        `Ensure it is defined in McpModuleOptions.servers and that tools/resources correctly specify this serverName.`
      );
    }
    return registry;
  }

  /**
   * Get all server names
   */
  getServers(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get all tools from a specific server
   */
  getAllTools(serverName: string) {
    const registry = this.getServerRegistry(serverName);
    return registry.getAllTools();
  }

  /**
   * Get all resources from a specific server
   */
  getAllResources(serverName: string) {
    const registry = this.getServerRegistry(serverName);
    return registry.getAllResources();
  }

  /**
   * Get all prompts from a specific server
   */
  getAllPrompts(serverName: string) {
    const registry = this.getServerRegistry(serverName);
    return registry.getAllPrompts();
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
          const componentName = wrapper.name; // For logging

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
                  if (!this.servers.has(serverName)) {
                    throw new Error(
                      `Cannot register tool '${toolName}' from ${componentName}.${methodName} for server '${serverName}'. ` +
                      `ServerRegistry for '${serverName}' was not found. ` +
                      `Ensure '${serverName}' is defined in McpModuleOptions.servers.`
                    );
                  }
                  const serverRegistry = this.servers.get(serverName)!;
                  serverRegistry.registerTool(toolName, toolOptions, methodRef.bind(instance));
                  this.logger.log(`Registered tool '${toolName}' for server '${serverName}' from ${componentName}.${methodName}`);
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
        .filter(wrapper => wrapper.instance && Object.getPrototypeOf(wrapper.instance))
        .map(async wrapper => {
          const { instance } = wrapper;
          const prototype = Object.getPrototypeOf(instance);
          const componentName = wrapper.name; // For logging

          this.metadataScanner.scanFromPrototype(
            instance,
            prototype,
            methodName => {
              const methodRef = instance[methodName];
              const metadata = Reflect.getMetadata(MCP_RESOURCE_METADATA_KEY, methodRef);

              if (metadata) {
                const resourceOptions = metadata as McpResourceOptions;
                const serverNames = Array.isArray(resourceOptions.server)
                  ? resourceOptions.server
                  : [resourceOptions.server];

                for (const serverName of serverNames) {
                  if (!this.servers.has(serverName)) {
                    throw new Error(
                      `Cannot register resource with URI '${resourceOptions.uri}' from ${componentName}.${methodName} for server '${serverName}'. ` +
                      `ServerRegistry for '${serverName}' was not found. ` +
                      `Ensure '${serverName}' is defined in McpModuleOptions.servers.`
                    );
                  }
                  const serverRegistry = this.servers.get(serverName)!;
                  serverRegistry.registerResource(resourceOptions.uri, resourceOptions, methodRef.bind(instance));
                  this.logger.log(`Registered resource with URI '${resourceOptions.uri}' for server '${serverName}' from ${componentName}.${methodName}`);
                }
              }
            },
          );
        }),
    );
  }

  /**
   * Discover and register prompts using @McpPrompt decorator
   */
  private async discoverAndRegisterPrompts() {
    const providers = this.discoveryService.getProviders();

    await Promise.all(
      providers
        .filter(wrapper => wrapper.instance && Object.getPrototypeOf(wrapper.instance))
        .map(async wrapper => {
          const { instance } = wrapper;
          const prototype = Object.getPrototypeOf(instance);
          const componentName = wrapper.name; // For logging

          this.metadataScanner.scanFromPrototype(
            instance,
            prototype,
            methodName => {
              const methodRef = instance[methodName];
              const metadata = Reflect.getMetadata(MCP_PROMPT_METADATA_KEY, methodRef);

              if (metadata) {
                const promptOptions = metadata as McpPromptOptions;
                const serverNames = Array.isArray(promptOptions.server)
                  ? promptOptions.server
                  : [promptOptions.server];
                const promptName = promptOptions.name;

                for (const serverName of serverNames) {
                  if (!this.servers.has(serverName)) {
                    throw new Error(
                      `Cannot register prompt '${promptName}' from ${componentName}.${methodName} for server '${serverName}'. ` +
                      `ServerRegistry for '${serverName}' was not found. ` +
                      `Ensure '${serverName}' is defined in McpModuleOptions.servers.`
                    );
                  }
                  const serverRegistry = this.servers.get(serverName)!;
                  serverRegistry.registerPrompt(promptName, promptOptions, methodRef.bind(instance));
                  this.logger.log(`Registered prompt '${promptName}' for server '${serverName}' from ${componentName}.${methodName}`);
                }
              }
            },
          );
        }),
    );
  }
}
