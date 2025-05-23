import { Body, Controller, HttpCode, Post, Req, Res, UseFilters, UseGuards } from '@nestjs/common';
import { JsonRpcRequest, JsonRpcExceptionFilter, McpHandler } from '@sowonai/nest-mcp-adapter';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';

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
