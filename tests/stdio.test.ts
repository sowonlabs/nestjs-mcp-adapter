import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  InitializeRequest,
  InitializeResultSchema,
  CallToolRequest,
  CallToolResultSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

describe('Greet Test', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });

    transport = new StdioClientTransport({
      command: 'npx',
      args: ['ts-node', 'examples/greet/main-stdio.ts'],
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    // Close connection after tests
    if (transport) {
      await transport.close();
      console.log('Closed MCP server connection.');
    }
  });

  it('initialize test', async () => {
    const request: InitializeRequest = {
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

    const response = await client.request(request, InitializeResultSchema);
    console.log('Response:', response);
  }, 60_000);

  it('tools/call test', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'hello',
        arguments: {}
      }
    };

    const response = await client.request(request, CallToolResultSchema);
    console.log('Response:', response);
  }, 60_000);
  
});

