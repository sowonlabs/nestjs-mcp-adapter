import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src/decorators/mcp-tool.decorator';
import { z } from 'zod';

@Injectable()
export class GreetToolService {
  @McpTool({
    server: 'mcp-greet',
    name: 'hello',
    description: 'Say hello to the user.',
    input: z.object({}),
    annotations: {
      title: 'Hello',
      readOnlyHint: true,
      desctructiveHint: false,
    }
  })
  async hello() {
    return {
      content: [{ type: 'text', text: 'Hello, MCP!' }]
    };
  }
}
