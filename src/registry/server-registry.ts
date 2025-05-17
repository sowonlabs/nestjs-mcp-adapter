import { Injectable } from '@nestjs/common';
import { McpToolOptions } from '../decorators/mcp-tool.decorator';
import { McpResourceOptions } from '../decorators/mcp-resource.decorator';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ErrorCode, McpError } from '../errors/mcp-error';

/**
 * 단일 서버의 도구와 리소스를 관리하는 레지스트리
 */
@Injectable()
export class ServerRegistry {
  private readonly tools = new Map<string, { metadata: McpToolOptions; handler: Function }>();
  private readonly resources = new Map<string, { metadata: McpResourceOptions; handler: Function }>();
  
  /**
   * 도구 등록
   */
  registerTool(name: string, metadata: McpToolOptions, handler: Function): void {
    this.tools.set(name, { metadata, handler });
  }
  
  /**
   * 리소스 등록
   */
  registerResource(uri: string, metadata: McpResourceOptions, handler: Function): void {
    this.resources.set(uri, { metadata, handler });
  }
  
  /**
   * 도구 조회
   */
  getTool(name: string): { metadata: McpToolOptions; handler: Function } | undefined {
    return this.tools.get(name);
  }
  
  /**
   * 리소스 조회
   */
  getResource(uri: string): { metadata: McpResourceOptions; handler: Function } | undefined {
    return this.resources.get(uri);
  }
  
  /**
   * 모든 도구 조회
   */
  getAllTools(): { name: string; metadata: McpToolOptions; handler: Function }[] {
    return Array.from(this.tools.entries()).map(([name, value]) => ({
      name,
      metadata: value.metadata,
      handler: value.handler,
    }));
  }
  
  /**
   * 모든 리소스 조회
   */
  getAllResources(): { uri: string; metadata: McpResourceOptions; handler: Function }[] {
    return Array.from(this.resources.entries()).map(([uri, value]) => ({
      uri,
      metadata: value.metadata,
      handler: value.handler,
    }));
  }
  
  /**
   * 서버 메타데이터 가져오기
   */
  getServerMetadata() {
    const tools = Array.from(this.tools.entries()).map(([name, { metadata }]) => ({
      name: metadata.name || name,
      description: metadata.description,
      inputSchema: metadata.input ? zodToJsonSchema(metadata.input) : undefined,
      annotations: metadata.annotations,
    }));
    
    const resources = Array.from(this.resources.entries()).map(([uri, { metadata }]) => ({
      uri: metadata.uri,
      description: metadata.description,
      mimeType: metadata.mimeType,
    }));
    
    return {
      tools,
      resources,
    };
  }
}
