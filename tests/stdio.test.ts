import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  InitializeRequest,
  InitializeResultSchema,
  CallToolRequest,
  CallToolResultSchema,
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
      command: 'sh',
      args: [
        '-c',
        'cd ../ && npm run example:greet:stdio',
      ],
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

    // 응답 기본 구조 검증
    expect(response).toBeDefined();
    expect(response.protocolVersion).toBeDefined();
    expect(response.capabilities).toBeDefined();
    expect(response.serverInfo).toBeDefined();
    expect(response.instructions).toBeDefined();
    
    // 프로토콜 버전 검증
    expect(response.protocolVersion).toBe('2024-11-05');
    
    // 서버 정보 검증
    expect(response.serverInfo.name).toBe('greet');
    expect(response.serverInfo.version).toBe('1.0.0');
    
    // capabilities 구조 검증
    expect(response.capabilities.logging).toBeDefined();
    expect(response.capabilities.prompts).toBeDefined();
    expect(response.capabilities.resources).toBeDefined();
    expect(response.capabilities.tools).toBeDefined();

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
    expect(response.content).toBeDefined();
    expect(response.isError).toBe(false);
    expect(Array.isArray(response.content)).toBe(true);

    if (response.content) {
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toBe('Hello, MCP!');
    }

    console.log('Response:', response);
  }, 60_000);
  
});

