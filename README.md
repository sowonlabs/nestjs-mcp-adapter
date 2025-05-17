# @sowonai/nestjs-mcp-adapter

이 프로젝트는 NestJS MCP(model context protocol) 서버 개발을 편리하게 돕는 라이브러리입니다.
STDIO, HTTP 프로토콜을 지원하며, AuthGuard, Interceptor등 프로토콜에 상관없이 모든 NestJS의 기능을 활용할 수 있습니다.

## Installation

```bash
npm install @sowonai/nest-mcp-adapter @nestjs/platform-express @modelcontextprotocol/sdk zod
```

## 사용 예시

```typescript
import { Injectable } from '@nestjs/common';
import { McpTool } from '@sowonai/nest-mcp-adapter';
import { z } from 'zod';

@Injectable()
export class CalculatorToolService {
  @McpTool({
    server: 'mcp-cacluator',
    name: 'calculate',
    description: '수학 연산 수행을 수행합니다.',
    input: z.object({
      a: z.number().describe('첫번째 숫자'),
      b: z.number().describe('두번째 숫자'),
      operation: z.string().desc('연산 타입')
    }),
    annotations: {
      title: 'Calculate',
      readOnlyHint: true,
      desctructiveHint: false,
    }
  })
  async calculate(params: any) {
    const { a, b, operation } = params;
    
...

    return {
      content: [{ type: 'text', text: String(result) }]
    };
  }
}
```

```typescript
import { Injectable } from '@nestjs/common';
import { McpResource } from '@sowonai/nest-mcp-adapter';

@Injectable()
export class UsersResource {
  @McpResource({
    server: 'mcp-userinfo',
    uri: 'users://{userId}/profile',
    description: '사용자 프로필 정보',
    mimeType: 'text/plain',
  })
  async getUserProfile({ uri, userId }) {
    return {
      contents: [{
        uri,
        text: `사용자 ID: ${userId}\n이름: 홍길동\n직책: 개발자`
      }]
    };
  }
}
```

```typescript
import { Injectable, Controller, Post, UseGuards } from '@nestjs/common';
import { McpResource, McpError, ErrorCode, JsonRpcRequest } from '@sowonai/nest-mcp-adapter';
import { AuthGuard } from './auth.guard';

@Controller('mcp')
@UseGuards(AuthGuard)
export class McpCalculatorController {
  constructor(
    private readonly multiServerRegistry: MultiServerRegistry,
    private readonly mcpToolHandler: McpToolHandler
  ) {}

  @Post(':serverName')
  async handlePost(
    @Param('serverName') serverName: string = 'default',
    @Headers('mcp-session-id') sessionId: string,
    @Body() body: JsonRpcRequest,
  ) {
    return this.mcpToolHandler.handlePostRequest(serverName, body);
  }

  @Get(':serverName')
  async handleGet(
    @Param('serverName') serverName: string = 'default'
  ) {
    return this.mcpToolHandler.handleGetRequest(serverName, body);
  }
}
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { McpAdapterModule } from '@sowonai/nest-mcp-adapter';
import { AuthGuard } from './auth.guard';
import { CalculatorToolService } from './calculator.tool';

@Module({
  imports: [
    McpAdapterModule.forRoot()
  ],
  providers: [AuthGuard, CalculatorToolService]
})
export class AppModule {
}
```

## Http Protocol 사용 예시

```typescript
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false
  });

  await app.init();
  await app.listen(3000);
}
```

## Stdio Protocol 사용 예시

```typescript
import { NestFactory } from '@nestjs/core';
import { StdioExpressAdapter } from '@sowonai/nest-mcp-adapter';

async function bootstrap() {
  const adapter = new StdioExpressAdapter('/mcp/mcp-calculator');
  const app = await NestFactory.create(AppModule, adapter, {
    logger: false
  });

  await app.init();
  await app.listen(0); // Not bind actually
}
```

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please submit a pull request. All contributions are appreciated.

## License

MIT
