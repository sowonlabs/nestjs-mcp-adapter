import { Injectable, Logger, Inject } from '@nestjs/common';
import { MultiServerRegistry } from '@registry/multi-server-registry';
import { JsonRpcRequest, JsonRpcResponse } from '@interfaces/json-rpc.interface';
import { Request, Response } from 'express';
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
    return {};
  }

  private async handleToolsListRequest(serverName: string, request: McpRequest<'tools/list'>): Promise<McpResponse<'tools/list'>['result']> { 
    const registry = this.multiServerRegistry.getServerRegistry(serverName);
    const toolInfos = registry.getAllTools();

    const mcpTools: Tool[] = toolInfos.map((toolInfo) => {
      const { name: toolKey, metadata } = toolInfo;
      const { name: metaName, description, input: zodInputSchema, annotations: toolAnnotations } = metadata; // inputSchema -> input
      
      let jsonSchema: any = {};
      if (zodInputSchema) {
        jsonSchema = zodToJsonSchema(z.object(zodInputSchema), { target: 'openApi3' });
      }

      const mcpTool: Tool = {
        name: metaName || toolKey,
        description: description || 'No description provided',
        inputSchema: {
          type: jsonSchema.type || 'object',
          properties: jsonSchema.properties || {},
          required: jsonSchema.required || [],
          description: jsonSchema.description,
        },
        annotations: {},
      };
      
      // inputSchema description
      if (zodInputSchema && jsonSchema.properties) {
        const shape = zodInputSchema;
        for (const key in shape) {
          const field = shape[key] as z.ZodTypeAny;
          if (field.description && mcpTool.inputSchema.properties && mcpTool.inputSchema.properties[key]) {
            if (!(mcpTool.inputSchema.properties[key] as any).description) {
               (mcpTool.inputSchema.properties[key] as any).description = field.description;
            }
          }
        }
      }

      // annotations
      if (toolAnnotations) {
        const currentAnnotations: McpToolAnnotations = {};
        if (toolAnnotations.title) currentAnnotations.title = toolAnnotations.title;
        if (toolAnnotations.readOnlyHint) currentAnnotations.readOnlyHint = toolAnnotations.readOnlyHint;
        if (toolAnnotations.desctructiveHint) currentAnnotations.destructiveHint = toolAnnotations.desctructiveHint; 
        if (toolAnnotations.idempotentHint) currentAnnotations.idempotentHint = toolAnnotations.idempotentHint;
        if (toolAnnotations.openWorldHint) currentAnnotations.openWorldHint = toolAnnotations.openWorldHint;
        mcpTool.annotations = currentAnnotations;
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
