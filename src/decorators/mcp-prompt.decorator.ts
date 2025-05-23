import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { MCP_PROMPT_METADATA_KEY } from './constants';

/**
 * @McpPrompt decorator options interface
 */
export interface McpPromptOptions {
  server: string | string[]; // Support multiple servers
  name: string;
  description: string;
  prompt: string; // The prompt text/content
  annotations?: {
    title?: string;
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
}

/**
 * McpPrompt decorator
 * Registers a method as an MCP prompt.
 */
export function McpPrompt(options: McpPromptOptions): CustomDecorator<string> {
  return SetMetadata(MCP_PROMPT_METADATA_KEY, options);
}