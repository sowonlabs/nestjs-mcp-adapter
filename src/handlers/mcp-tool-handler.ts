import { Injectable } from '@nestjs/common';
import { MultiServerRegistry } from '../registry/multi-server-registry';
import { ErrorCode, McpError } from '../errors/mcp-error';
import { JsonRpcRequest, JsonRpcResponse } from '../interfaces/json-rpc.interface';
import {
  isJSONRPCRequest
} from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool request handler
 */
@Injectable()
export class McpToolHandler {
  constructor(private readonly multiServerRegistry: MultiServerRegistry) {}

  /**
   * Handle POST request
   * Handles tool execution requests
   */
  async handlePost(serverName: string, body: JsonRpcRequest): Promise<JsonRpcResponse> {
    const registry = this.multiServerRegistry.getServerRegistry(serverName);

    if (!registry) {
      throw new McpError(ErrorCode.ServerNotFound, 'Server not found');
    }

    if (!isJSONRPCRequest(body)) {
      throw new McpError(ErrorCode.InvalidRequest, 'Invalid JSON-RPC request');
    }

    const { jsonrpc } = body;
    if (jsonrpc !== '2.0') {
      throw new McpError(ErrorCode.InvalidRequest, 'Invalid JSON-RPC version');
    }

    const { id, method, params } = body;

    // tools/list 요청 처리
    if (method === 'tools/list') {
      return this.handleToolsList(serverName, body);
    }

    const tool = registry.getTool(method);

    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${method}`);
    }

    // Parameter validation (using zod schema)
    const { metadata, handler } = tool;
    let validatedParams = params;
    if (metadata.input) {
      try {
        validatedParams = metadata.input.parse(params);
      } catch (error) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.message}`);
      }
    }

    // Execute tool
    const result = await handler(validatedParams);

    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }
  
  /**
   * Handle GET request
   * Returns server metadata
   */
  async handleGet(serverName: string): Promise<any> {
    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    return registry.getServerMetadata();
  }

  /**
   * Handle tools/list request
   * Returns list of tools
   */
  protected handleToolsList(serverName: string, body: JsonRpcRequest): JsonRpcResponse {
    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    if (!registry) {
      throw new McpError(ErrorCode.ServerNotFound, '서버를 찾을 수 없음');
    }

    const { id } = body;

    // Get server metadata via getServerMetadata method
    const serverMetadata = registry.getServerMetadata();

    // Extract only the tool list
    const tools = serverMetadata.tools;

    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools
      }
    };
  }
}
