import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  InitializeRequest,
  ListResourcesRequest,
  ListResourcesResultSchema,
  z as mcpZ,
} from '@modelcontextprotocol/sdk/types.js';

// Define schemas for resources/get since naming may differ from what we use
type ReadResourceRequest = {
  method: 'resources/get';
  params: {
    uri: string;
  };
};

const ReadResourceResultSchema = mcpZ.object({
  result: mcpZ.object({
    data: mcpZ.any(),
    mimeType: mcpZ.string(),
  }),
});

describe('MCP Resources Test', () => {
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

  it('should list resources', async () => {
    const request: ListResourcesRequest = {
      method: 'resources/list',
      params: {}
    };

    const response = await client.request(request, ListResourcesResultSchema);
    console.log('Resources List Response:', JSON.stringify(response, null, 2));
    
    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result.resources).toBeDefined();
    expect(Array.isArray(response.result.resources)).toBe(true);
    
    // At least expect to find the users resource we defined in examples
    const userResource = response.result.resources.find(
      resource => resource.uri?.includes('users://{userId}/profile')
    );
    expect(userResource).toBeDefined();
    expect(userResource?.description).toContain('User profile');
    expect(userResource?.mimeType).toBe('text/plain');
  }, 60_000);
  
  it('should get a specific resource', async () => {
    const request: ReadResourceRequest = {
      method: 'resources/get',
      params: {
        uri: 'users://{userId}/profile'
      }
    };

    const response = await client.request(request, ReadResourceResultSchema);
    console.log('Resource Get Response:', JSON.stringify(response, null, 2));
    
    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result.data).toBeDefined();
    expect(response.result.mimeType).toBe('text/plain');
    
    // Check the resource contents based on what we expect from the example
    if (response.result.data && typeof response.result.data === 'object') {
      expect(response.result.data.contents).toBeDefined();
      expect(Array.isArray(response.result.data.contents)).toBe(true);
      expect(response.result.data.contents[0].text).toContain('User ID:');
    }
  }, 60_000);
});