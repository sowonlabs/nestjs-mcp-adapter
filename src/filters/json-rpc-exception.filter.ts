import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { McpError, ErrorCode } from '../errors/mcp-error';
import { Response } from 'express';

/**
 * JSON-RPC exception filter
 * Formats error responses according to the JSON-RPC 2.0 standard
 */
@Catch()
export class JsonRpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Extract JSON-RPC ID from request
    const id = request.body?.id ?? null;

    // Default response structure
    const jsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: ErrorCode.InternalError,
        message: 'Unknown error',
        data: null,
      },
    };

    // Handle McpError type exceptions
    if (exception instanceof McpError) {
      jsonRpcResponse.error.code = exception.code;
      jsonRpcResponse.error.message = exception.message || 'Unknown error';

      // Set HTTP status code
      let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      if (exception.code === ErrorCode.InvalidRequest || exception.code === ErrorCode.InvalidParams) {
        httpStatus = HttpStatus.BAD_REQUEST;
      } else if (exception.code === ErrorCode.MethodNotFound || exception.code === ErrorCode.ServerNotFound) {
        httpStatus = HttpStatus.NOT_FOUND;
      }

      return response.status(httpStatus).json(jsonRpcResponse);
    }

  }
}
