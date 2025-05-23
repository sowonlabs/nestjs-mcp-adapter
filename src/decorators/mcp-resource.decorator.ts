import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { MCP_RESOURCE_METADATA_KEY } from './constants';

/**
 * @McpResource decorator options interface
 */
export interface McpResourceOptions {
  server: string | string[];
  uri: string;
  description: string;
  mimeType: string;
}

/**
 * McpResource decorator
 * Registers a method as an MCP resource.
 */
export function McpResource(options: McpResourceOptions): CustomDecorator<string> {
  return SetMetadata(MCP_RESOURCE_METADATA_KEY, options);
}
