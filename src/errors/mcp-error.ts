import {
  ErrorCode as SdkErrorCode,
  McpError as SdkMcpError,
} from '@modelcontextprotocol/sdk/types.js';

enum AdditionalErrorCode {
  ServerNotFound = -32600
}

export const ErrorCode = {
  ...SdkErrorCode,
  ...AdditionalErrorCode,
}

/**
 * MCP 에러 클래스
 */
export class McpError extends SdkMcpError {
  constructor(public readonly code: number, message: string) {
    super(code, message);
    this.name = 'McpError';
  }
}
