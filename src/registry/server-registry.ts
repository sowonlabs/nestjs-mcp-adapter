import { Injectable } from '@nestjs/common';
import { McpToolOptions } from '../decorators/mcp-tool.decorator';
import { McpResourceOptions } from '../decorators/mcp-resource.decorator';
import { McpPromptOptions } from '../decorators/mcp-prompt.decorator';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ErrorCode, McpError } from '../errors/mcp-error';

/**
 * Registry for managing tools and resources of a single server
 */
@Injectable()
export class ServerRegistry {
  private readonly tools = new Map<string, { metadata: McpToolOptions<any>; handler: Function }>();
  private readonly resources = new Map<string, { metadata: McpResourceOptions; handler: Function }>();
  private readonly prompts = new Map<string, { metadata: McpPromptOptions; handler: Function }>();
  
  /**
   * Register a tool
   */
  registerTool(name: string, metadata: McpToolOptions<any>, handler: Function): void {
    this.tools.set(name, { metadata, handler });
  }
  
  /**
   * Register a resource
   */
  registerResource(uri: string, metadata: McpResourceOptions, handler: Function): void {
    this.resources.set(uri, { metadata, handler });
  }
  
  /**
   * Register a prompt
   */
  registerPrompt(name: string, metadata: McpPromptOptions, handler: Function): void {
    this.prompts.set(name, { metadata, handler });
  }
  
  /**
   * Get a tool
   */
  getTool(name: string): { metadata: McpToolOptions<any>; handler: Function } | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Get a resource
   */
  getResource(uri: string): { metadata: McpResourceOptions; handler: Function } | undefined {
    return this.resources.get(uri);
  }
  
  /**
   * Get a prompt
   */
  getPrompt(name: string): { metadata: McpPromptOptions; handler: Function } | undefined {
    return this.prompts.get(name);
  }
  
  /**
   * Get all tools
   */
  getAllTools(): { name: string; metadata: McpToolOptions<any>; handler: Function }[] {
    return Array.from(this.tools.entries()).map(([name, value]) => ({
      name,
      metadata: value.metadata,
      handler: value.handler,
    }));
  }
  
  /**
   * Get all resources
   */
  getAllResources(): { uri: string; metadata: McpResourceOptions; handler: Function }[] {
    return Array.from(this.resources.entries()).map(([uri, value]) => ({
      uri,
      metadata: value.metadata,
      handler: value.handler,
    }));
  }
  
  /**
   * Get all prompts
   */
  getAllPrompts(): { name: string; metadata: McpPromptOptions; handler: Function }[] {
    return Array.from(this.prompts.entries()).map(([name, value]) => ({
      name,
      metadata: value.metadata,
      handler: value.handler,
    }));
  }
  
  /**
   * Get server metadata
   */
  getServerMetadata() {
    const tools = Array.from(this.tools.entries()).map(([name, { metadata }]) => ({
      name: metadata.name || name,
      description: metadata.description,
      inputSchema: metadata.input ? zodToJsonSchema(metadata.input) : undefined,
      annotations: metadata.annotations,
    }));
    
    const resources = Array.from(this.resources.entries()).map(([uri, { metadata }]) => ({
      uri: metadata.uri,
      description: metadata.description,
      mimeType: metadata.mimeType,
    }));
    
    const prompts = Array.from(this.prompts.entries()).map(([name, { metadata }]) => ({
      name: metadata.name,
      description: metadata.description,
      prompt: metadata.prompt,
      annotations: metadata.annotations,
    }));
    
    return {
      tools,
      resources,
      prompts,
    };
  }
}
