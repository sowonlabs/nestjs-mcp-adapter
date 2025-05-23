import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  InitializeRequest,
  z as mcpZ,
} from '@modelcontextprotocol/sdk/types.js';

// Define schema for prompts/list since it might not be in the SDK yet
const ListPromptsResultSchema = mcpZ.object({
  result: mcpZ.object({
    prompts: mcpZ.array(
      mcpZ.object({
        name: mcpZ.string(),
        description: mcpZ.string(),
        annotations: mcpZ.record(mcpZ.string(), mcpZ.any()).optional(),
      })
    ),
  }),
});

type ListPromptsRequest = {
  method: 'prompts/list';
  params?: {};
};

describe('MCP Prompts Test', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });

    transport = new StdioClientTransport({
      command: 'npx',
      args: ['ts-node', 'examples/multi-server/main-stdio.ts'],
    });

    await client.connect(transport);
    
    // Initialize the client with the server
    const initRequest: InitializeRequest = {
      method: 'initialize',
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: {
          name: "test",
          version: "0.1.0"
        }
      }
    };
    await client.request(initRequest, mcpZ.any());
  });

  afterAll(async () => {
    // Close connection after tests
    if (transport) {
      await transport.close();
      console.log('Closed MCP server connection.');
    }
  });

  it('should list prompts', async () => {
    const request: ListPromptsRequest = {
      method: 'prompts/list',
      params: {}
    };

    const response = await client.request(request, ListPromptsResultSchema);
    console.log('Prompts List Response:', JSON.stringify(response, null, 2));
    
    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result.prompts).toBeDefined();
    expect(Array.isArray(response.result.prompts)).toBe(true);
    
    // At least expect to find the prompts we defined in the examples
    const summarizePrompt = response.result.prompts.find(
      prompt => prompt.name === 'summarize'
    );
    expect(summarizePrompt).toBeDefined();
    expect(summarizePrompt?.description).toContain('Summarize');
    expect(summarizePrompt?.annotations).toBeDefined();
    expect(summarizePrompt?.annotations?.title).toBe('Text Summarizer');
    
    const mathPrompt = response.result.prompts.find(
      prompt => prompt.name === 'math-helper'
    );
    expect(mathPrompt).toBeDefined();
    expect(mathPrompt?.description).toContain('math');
    expect(mathPrompt?.annotations).toBeDefined();
    expect(mathPrompt?.annotations?.category).toBe('Mathematics');
  }, 60_000);
});