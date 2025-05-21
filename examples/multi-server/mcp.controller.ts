import { Controller, Post, Get, Param, Body, UseGuards, Req, Res, HttpCode, UseFilters, UseInterceptors } from '@nestjs/common';
import { McpHandler } from '../../src/handlers/mcp-handler';
import { JsonRpcRequest } from '../../src/interfaces/json-rpc.interface';
import { JsonRpcExceptionFilter } from '../../src/filters/json-rpc-exception.filter';
import { AuthGuard } from './auth.guard';
import { Request, Response } from 'express';
import { LoggingInterceptor } from './logging.interceptor';

@Controller('mcp')
@UseGuards(AuthGuard)
@UseFilters(JsonRpcExceptionFilter)
// @UseInterceptors(LoggingInterceptor)
export class McpController {
  constructor(
    private readonly mcpHandler: McpHandler
  ) {}

  @Post(':serverName')
  @HttpCode(202)
  async handlePost(
    @Param('serverName') serverName: string = 'default',
    @Req() req: Request, @Res() res: Response, @Body() body: any
  ) {
    const result = await this.mcpHandler.handleRequest(serverName, req, res, body);

    // If it's a notification request or the response is null, send an empty response
    if (result === null) {
      return res.end();
    }

    // Response for a regular request
    return res.json(result);
  }
}
