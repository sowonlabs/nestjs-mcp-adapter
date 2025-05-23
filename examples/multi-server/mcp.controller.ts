import { Body, Controller, HttpCode, Param, Post, Req, Res, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { JsonRpcRequest, JsonRpcExceptionFilter, McpHandler } from '@sowonai/nest-mcp-adapter';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { LoggingInterceptor } from './logging.interceptor';

@Controller('mcp/:serverName')
@UseGuards(AuthGuard)
@UseFilters(JsonRpcExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class McpController {
  constructor(
    private readonly mcpHandler: McpHandler
  ) {}

  @Post()
  @HttpCode(202)
  async handlePost(
    @Param('serverName') serverName: string, // Inject serverName using @Param decorator
    @Req() req: Request, 
    @Res() res: Response, 
    @Body() body: JsonRpcRequest
  ) {
    // Use the injected serverName
    const result = await this.mcpHandler.handleRequest(serverName, req, res, body);

    // If it's a notification request or the response is null, send an empty response
    if (result === null) {
      return res.end();
    }

    // Response for a regular request
    return res.json(result);
  }
}
