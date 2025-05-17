import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { MCP_RESOURCE_METADATA_KEY } from './constants';

/**
 * @McpResource 데코레이터 옵션 인터페이스
 */
export interface McpResourceOptions {
  server: string | string[]; // 문자열 또는 문자열 배열로 변경
  uri: string;
  description: string;
  mimeType: string;
}

/**
 * McpResource 데코레이터
 * 메소드를 MCP 리소스로 등록합니다.
 */
export function McpResource(options: McpResourceOptions): CustomDecorator<string> {
  return SetMetadata(MCP_RESOURCE_METADATA_KEY, options);
}
