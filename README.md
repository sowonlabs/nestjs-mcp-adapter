# @sowonai/nestjs-mcp-adapter


This project is a library that helps you conveniently develop NestJS MCP (Model Context Protocol) servers.
It supports both STDIO and HTTP protocols, and allows you to use all features of NestJS such as AuthGuard and Interceptor regardless of the protocol.

## Installation

```bash
npm install @sowonai/nest-mcp-adapter @nestjs/platform-express @modelcontextprotocol/sdk zod
```


## Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { McpTool } from '@sowonai/nest-mcp-adapter';
import { z } from 'zod';

@Injectable()
export class CalculatorToolService {
  @McpTool({
    server: 'mcp-cacluator',
    name: 'calculate',
    description: 'Performs mathematical operations.',
    input: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
      operation: z.string().desc('Operation type')
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
    description: 'User profile information',
    mimeType: 'text/plain',
  })
  async getUserProfile({ uri, userId }) {
    return {
      contents: [{
        uri,
        text: `User ID: ${userId}\nName: Hong Gil-dong\nPosition: Developer`
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


## Example: Using HTTP Protocol

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


## Example: Using STDIO Protocol

```typescript
import { NestFactory } from '@nestjs/core';
import { StdioExpressAdapter } from '@sowonai/nest-mcp-adapter';

async function bootstrap() {
  const adapter = new StdioExpressAdapter('/mcp/mcp-calculator');
  const app = await NestFactory.create(AppModule, adapter, {
    logger: false
  });

  await app.init();
  await app.listen(0); // Not actually bound
}
```

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please submit a pull request. All contributions are appreciated.

## License

MIT
