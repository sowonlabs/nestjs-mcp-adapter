import { Controller, Post, Get, Param, Body, UseGuards, UseFilters } from '@nestjs/common';
import { McpToolHandler } from '../../src/handlers/mcp-tool-handler';
import { JsonRpcRequest } from '../../src/interfaces/json-rpc.interface';
import { JsonRpcExceptionFilter } from '../../src/filters/json-rpc-exception.filter';
import { AuthGuard } from './auth.guard';

@Controller('mcp')
@UseGuards(AuthGuard)
@UseFilters(JsonRpcExceptionFilter)
export class McpController {
  constructor(
    private readonly mcpToolHandler: McpToolHandler
  ) {}

  @Post(':serverName')
  async handlePost(
    @Param('serverName') serverName: string = 'default',
    @Body() body: JsonRpcRequest,
  ) {
    return this.mcpToolHandler.handlePost(serverName, body);
  }

  @Get(':serverName')
  async handleGet(
    @Param('serverName') serverName: string = 'default'
  ) {
    return this.mcpToolHandler.handleGet(serverName);
  }
}
