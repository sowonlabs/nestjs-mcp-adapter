import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { McpError, ErrorCode } from '../errors/mcp-error';
import { Response } from 'express';

/**
 * JSON-RPC 예외 필터
 * JSON-RPC 2.0 표준에 맞춰 에러 응답을 포맷팅함
 */
@Catch()
export class JsonRpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 요청에서 JSON-RPC ID 추출
    const id = request.body?.id ?? null;

    // 기본 응답 구조
    const jsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: ErrorCode.InternalError,
        message: 'Unknown error',
        data: null,
      },
    };

    // McpError 타입 예외 처리
    if (exception instanceof McpError) {
      jsonRpcResponse.error.code = exception.code;
      jsonRpcResponse.error.message = exception.message || 'Unknown error';

      // HTTP 상태 코드 설정
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
