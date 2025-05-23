import { Injectable, Logger, Inject } from '@nestjs/common';
import { MultiServerRegistry } from '@registry/multi-server-registry';
import { JsonRpcRequest, JsonRpcResponse } from '@interfaces/json-rpc.interface';
import { Request, Response } from 'express'; // Response는 직접 사용하지 않으므로 제거
import { McpError, ErrorCode } from "@errors";
import { z } from 'zod';
import {
  isJSONRPCRequest,
  Tool,
  ToolAnnotations as McpToolAnnotations
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { McpModuleOptions } from '@interfaces';
import { MCP_MODULE_OPTIONS } from '@decorators/constants';

// Define types directly (ensure compatibility with the actual SDK)
type McpRequest<T extends string = string> = JsonRpcRequest & {
  method: T;
  params?: any;
};

type McpResponse<T extends string = string> = JsonRpcResponse & {
  result: any;
};

/**
 * MCP tool request handler
 */
@Injectable()
export class McpHandler {
  private readonly logger:Logger = new Logger(McpHandler.name);

  constructor(
    private readonly multiServerRegistry: MultiServerRegistry,
    @Inject(MCP_MODULE_OPTIONS) private readonly options: McpModuleOptions,
  ) {}

  async handleRequest(serverName: string, req: Request, res: Response, body: any): Promise<JsonRpcResponse | null> {
    // Check for JSON-RPC notification (if id is null or missing)
    const isNotification = body.id === undefined || body.id === null;

    if (isNotification && body.method && body.method.startsWith('notifications/')) {
      return null;
    }

    // For regular requests, validate JSON-RPC format
    if (!isJSONRPCRequest(body)) {
      throw new McpError(ErrorCode.InvalidRequest, 'Invalid JSON-RPC request');
    }

    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    if (!registry) {
      throw new McpError(ErrorCode.ServerNotFound, `Server '${serverName}' not found`);
    }

    const { method, id } = body;
    let resultPayload;

    // Use type assertion to clarify the type of body
    const mcpRequest = body as McpRequest<any>; 

    switch (method) {
      case 'initialize':
        resultPayload = await this.handleInitializeRequest(serverName, mcpRequest as McpRequest<'initialize'>);
        break;
      case 'tools/list':
        resultPayload = await this.handleToolsListRequest(serverName, mcpRequest as McpRequest<'tools/list'>);
        break;
      case 'tools/call':
        resultPayload = await this.handleToolsCallRequest(serverName, mcpRequest as McpRequest<'tools/call'>);
        break;
      case 'ping':
        resultPayload = await this.handlePingRequest();
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Method '${method}' not found`);
    }

    return {
      jsonrpc: "2.0",
      id: id, 
      result: resultPayload,
    };
  }

  async handleInitializeRequest(serverName: string, request: McpRequest<'initialize'>): Promise<McpResponse<'initialize'>['result']> {
    let version;
    let instructions;

    if (this.options.servers && this.options.servers[serverName]) {
      const serverConfig = this.options.servers[serverName];
      version = serverConfig.version || "0.1.0";
      instructions = serverConfig.instructions || '';
    }

    return {
      protocolVersion: "2024-11-05", // for Claude Desktop
      capabilities: {
        logging: {},
        prompts: {},
        resources: {},
        tools: {},
      },
      serverInfo: {
        name: serverName,
        version: version,
      },
      instructions: instructions
    };
  }

  private async handlePingRequest(): Promise<McpResponse<'ping'>['result']> {
    // ping 요청에 대한 응답으로 간단한 객체 반환
    return {
      timestamp: new Date().toISOString(),
      status: "ok"
    };
  }

  private async handleToolsListRequest(serverName: string, request: McpRequest<'tools/list'>): Promise<McpResponse<'tools/list'>['result']> { 
    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    const toolInfos = registry.getAllTools();

    const mcpTools: Tool[] = toolInfos.map((toolInfo) => {
      const { name: toolKey, metadata } = toolInfo; // name을 toolKey로 변경하여 metadata.name과 구분
      const { name: metaName, description, input: zodInputSchema, annotations: toolAnnotations } = metadata; // inputSchema -> input
      
      let jsonSchema: any = {};
      if (zodInputSchema) {
        // zodInputSchema가 ZodRawShape이므로, z.object()로 감싸서 zodToJsonSchema에 전달
        jsonSchema = zodToJsonSchema(z.object(zodInputSchema), { target: 'openApi3' });
      }

      const mcpTool: Tool = {
        name: metaName || toolKey, // McpToolOptions에 정의된 name을 우선 사용, 없으면 등록 시 사용된 key
        description: description || 'No description provided',
        inputSchema: {
          type: jsonSchema.type || 'object',
          properties: jsonSchema.properties || {},
          required: jsonSchema.required || [],
          description: jsonSchema.description, // 스키마 최상위 설명
        },
        annotations: {},
      };

      // Annotations 매핑 (존재하는 경우에만)
      if (toolAnnotations) {
        const currentAnnotations: McpToolAnnotations = {};
        if (toolAnnotations.title) currentAnnotations.title = toolAnnotations.title;
        if (toolAnnotations.readOnlyHint) currentAnnotations.readOnlyHint = toolAnnotations.readOnlyHint;
        // desctructiveHint 오타 수정
        if (toolAnnotations.desctructiveHint) currentAnnotations.destructiveHint = toolAnnotations.desctructiveHint; 
        if (toolAnnotations.idempotentHint) currentAnnotations.idempotentHint = toolAnnotations.idempotentHint;
        if (toolAnnotations.openWorldHint) currentAnnotations.openWorldHint = toolAnnotations.openWorldHint;
        // MCP 표준 어노테이션 추가 (예시, 실제 SDK에 있는 어노테이션 확인 필요)
        // if (toolAnnotations.requiresReviewHint) currentAnnotations.requiresReviewHint = toolAnnotations.requiresReviewHint;
        // if (toolAnnotations.outputHint) currentAnnotations.outputHint = toolAnnotations.outputHint;
        mcpTool.annotations = currentAnnotations;
      }
      
      // inputSchema의 각 속성에 대한 설명 추가 (zod-to-json-schema가 이미 처리)
      // zod-to-json-schema v3+ 에서는 ZodObject의 .describe()가 JSON 스키마의 description으로 자동 변환됩니다.
      // 개별 속성의 .describe()도 해당 속성의 description으로 변환됩니다.
      // 따라서 아래 로직은 일반적으로 필요하지 않지만, 특정 케이스를 위해 남겨둘 수 있습니다.
      if (zodInputSchema && jsonSchema.properties) { // zodInputSchema는 ZodRawShape
        const shape = zodInputSchema; // z.object(zodInputSchema).shape 대신 직접 사용
        for (const key in shape) {
          const field = shape[key] as z.ZodTypeAny;
          if (field.description && mcpTool.inputSchema.properties && mcpTool.inputSchema.properties[key]) {
            // zodToJsonSchema가 이미 description을 포함시켰는지 확인 후, 없다면 할당
            if (!(mcpTool.inputSchema.properties[key] as any).description) {
               (mcpTool.inputSchema.properties[key] as any).description = field.description;
            }
          }
        }
      }
      return mcpTool;
    });

    return {
      tools: mcpTools,
    };
  }

  private async handleToolsCallRequest(serverName: string, request: McpRequest<'tools/call'>): Promise<McpResponse<'tools/call'>['result']> {
    const { name, arguments: args } = request.params || {};
    
    if (!name) {
      throw new McpError(ErrorCode.InvalidParams, "Tool name is required");
    }
    
    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    const tool = registry.getTool(name);
    
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' not found`);
    }
    
    try {
      // Execute the tool handler
      const result = await tool.handler(args || {});
      
      // Ensure the result is in the correct format
      if (!result || !result.content) {
        throw new McpError(ErrorCode.InternalError, `Tool '${name}' returned invalid result format`);
      }
      
      // Add isError field if not present
      if (result.isError === undefined) {
        result.isError = false;
      }
      
      return result;
    } catch (error) {
      // Handle errors that occur during tool execution
      this.logger.error(`Error executing tool '${name}':`, error);
      
      if (error instanceof McpError) {
        throw error; // Propagate MCP errors as is
      }
      
      // Convert general errors to appropriate response format
      return {
        content: [
          { 
            type: 'text', 
            text: `Error executing tool '${name}': ${error.message || 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }
}
