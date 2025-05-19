import { Controller, Post, Get, Body, UseGuards, UseFilters, Req, Res, HttpCode } from '@nestjs/common';
import { McpHandler } from '../../src/handlers/mcp-handler.service';
import { JsonRpcRequest } from '../../src/interfaces/json-rpc.interface';
import { AuthGuard } from './auth.guard';
import { JsonRpcExceptionFilter } from '../../src/filters/json-rpc-exception.filter';
import { Request, Response } from 'express';

@Controller('mcp')
@UseGuards(AuthGuard)
@UseFilters(JsonRpcExceptionFilter)
export class McpController {
  constructor(
    private readonly mcpHandler: McpHandler
  ) {}

  @Post()
  @HttpCode(202)
  async handlePost(@Req() req: Request, @Res() res: Response, @Body() body: JsonRpcRequest) {
    const result = await this.mcpHandler.handleRequest('mcp-greet', req, res, body);

    // If it's a notification request or the response is null, send an empty response
    if (result === null) {
      return res.end();
    }

    // Response for a regular request
    return res.json(result);
  }
}
