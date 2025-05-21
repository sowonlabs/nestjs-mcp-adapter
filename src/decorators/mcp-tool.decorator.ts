import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { MCP_TOOL_METADATA_KEY } from './constants';
import { z, ZodRawShape } from 'zod';

/**
 * @McpTool decorator options interface
 */
export interface McpToolOptions<Args extends ZodRawShape> {
  /**
   * MCP Server name
   */
  server: string | string[];
  /**
   * Unique identifier for the tool
   */
  name: string;
  /**
   * Human-readable description
   */
  description: string;
  /**
   * JSON Schema for the tool's parameters (inputSchema in specification)
   */
  input: Args;
  /**
   * Optional hints about tool behavior
   */
  annotations?: {
    /**
     * Human-readable title for the tool
     */
    title?: string;
    /**
     * If true, the tool does not modify its environment
     */
    readOnlyHint?: boolean;
    /**
     * If true, the tool may perform destructive updates
     */
    desctructiveHint?: boolean;
    /**
     * If true, repeated calls with same args have no additional effect
     */
    idempotentHint?: boolean;
    /**
     * If true, tool interacts with external entities
     */
    openWorldHint?: boolean;
  };
}

/**
 * McpTool decorator
 * Registers a method as an MCP tool.
 */
export function McpTool<Args extends ZodRawShape>(options: McpToolOptions<Args>): CustomDecorator<string> {
  return SetMetadata(MCP_TOOL_METADATA_KEY, options);
}
