import { Injectable } from '@nestjs/common';
import { MultiServerRegistry } from '../registry/multi-server-registry';
import { ErrorCode, McpError } from '../errors/mcp-error';
import { JsonRpcRequest, JsonRpcResponse } from '../interfaces/json-rpc.interface';
import {
  isJSONRPCRequest
} from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP 도구 요청 처리기
 */
@Injectable()
export class McpToolHandler {
  constructor(private readonly multiServerRegistry: MultiServerRegistry) {}

  /**
   * POST 요청 처리
   * 도구 실행 요청 처리
   */
  async handlePost(serverName: string, body: JsonRpcRequest): Promise<JsonRpcResponse> {
    const registry = this.multiServerRegistry.getServerRegistry(serverName);

    if (!registry) {
      throw new McpError(ErrorCode.ServerNotFound, '서버를 찾을 수 없음');
    }

    if (!isJSONRPCRequest(body)) {
      throw new McpError(ErrorCode.InvalidRequest, '잘못된 JSON-RPC 요청');
    }

    const { jsonrpc } = body;
    if (jsonrpc !== '2.0') {
      throw new McpError(ErrorCode.InvalidRequest, '잘못된 JSON-RPC 버전');
    }

    const { id, method, params } = body;

    // tools/list 요청 처리
    if (method === 'tools/list') {
      return this.handleToolsList(serverName, body);
    }

    const tool = registry.getTool(method);

    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `도구를 찾을 수 없음: ${method}`);
    }

    // 파라미터 검증 (zod 스키마 사용)
    const { metadata, handler } = tool;
    let validatedParams = params;
    if (metadata.input) {
      try {
        validatedParams = metadata.input.parse(params);
      } catch (error) {
        throw new McpError(ErrorCode.InvalidParams, `잘못된 파라미터: ${error.message}`);
      }
    }

    // 도구 실행
    const result = await handler(validatedParams);

    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }
  
  /**
   * GET 요청 처리
   * 서버 메타데이터 반환
   */
  async handleGet(serverName: string): Promise<any> {
    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    return registry.getServerMetadata();
  }

  /**
   * tools/list 요청 처리
   * 도구 목록 반환
   */
  protected handleToolsList(serverName: string, body: JsonRpcRequest): JsonRpcResponse {
    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    if (!registry) {
      throw new McpError(ErrorCode.ServerNotFound, '서버를 찾을 수 없음');
    }

    const { id } = body;

    // getServerMetadata 메소드를 통해 서버 메타데이터를 가져옴
    const serverMetadata = registry.getServerMetadata();

    // 도구 목록만 추출
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
