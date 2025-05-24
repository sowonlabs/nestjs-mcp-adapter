import { Module } from '@nestjs/common';
import { McpAdapterModule } from '../../src/mcp-adapter.module';
import { CalculatorToolService } from './calculator.tool';
import { UsersResourceService } from './users.resource';
import { PromptsService } from './prompts.service';
import { McpController } from './mcp.controller';
import { HelloController } from './hello.controller';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    McpAdapterModule.forRoot({
      servers: {
        'mcp-calculator': {
          version: '1.0.0',
          instructions: 'Calculator server: supports add, subtract, multiply, divide.',
        },
        'mcp-userinfo': {
          version: '0.1.0',
          instructions: 'User information server: provides user profiles.',
        },
        'mcp-other': {
          version: '0.2.0',
          instructions: 'A shared server for miscellaneous tools and resources.',
        },
      },
    }),
  ],
  controllers: [
    HelloController,
    McpController,
  ],
  providers: [
    CalculatorToolService,
    UsersResourceService,
    PromptsService,
    AuthGuard,
  ],
})
export class AppModule {}
