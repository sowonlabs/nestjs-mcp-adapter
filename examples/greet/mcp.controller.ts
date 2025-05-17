import { Controller, Post, Get, Body, UseGuards, UseFilters } from '@nestjs/common';
import { McpToolHandler } from '../../src/handlers/mcp-tool-handler';
import { JsonRpcRequest } from '../../src/interfaces/json-rpc.interface';
import { AuthGuard } from './auth.guard';
import { JsonRpcExceptionFilter } from '../../src/filters/json-rpc-exception.filter';

@Controller('mcp')
@UseGuards(AuthGuard)
@UseFilters(JsonRpcExceptionFilter)
export class McpController {
  constructor(
    private readonly mcpToolHandler: McpToolHandler
  ) {}

  @Post()
  async handlePost(@Body() body: JsonRpcRequest) {
    return this.mcpToolHandler.handlePost('mcp-greet', body);
  }

  @Get()
  async handleGet() {
    return this.mcpToolHandler.handleGet('mcp-greet');
  }
}
