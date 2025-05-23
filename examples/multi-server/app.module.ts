import { Module } from '@nestjs/common';
import { McpAdapterModule } from '@sowonai/nest-mcp-adapter';
import { AuthGuard } from './auth.guard';
import { CalculatorToolService } from './calculator.tool';
import { UsersResourceService } from './users.resource';
import { McpController } from './mcp.controller';
import { HelloController } from './hello.controller';

@Module({
  imports: [
    McpAdapterModule.forRoot({
      servers: {
        'calculator': {
          version: '1.0.0',
          instructions: 'You can use the calculator.',
        },
        'userinfo': {
          version: '1.0.0',
          instructions: 'You can use the user information.',
        },
        'other': {
          version: '1.0.0',
          instructions: 'You can use the other server.', 
        }
      },
    }),
  ],
  controllers: [
    McpController,
    HelloController, // HelloController 추가
  ],
  providers: [
    CalculatorToolService,
    UsersResourceService,
    AuthGuard,
  ],
})
export class AppModule {}
