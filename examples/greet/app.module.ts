import { Module } from '@nestjs/common';
import { McpAdapterModule } from '../../src/mcp-adapter.module';
import { GreetToolService } from './greet.tool';
import { McpController } from './mcp.controller';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    McpAdapterModule.forRoot({
      servers: {
        'mcp-greet': {
          version: '1.0.0',
          instructions: 'Welcome to the Greet Server! Use the helloMessage tool to get a greeting.',
        }
      }
    }),
  ],
  controllers: [
    McpController,
  ],
  providers: [
    GreetToolService,
    AuthGuard
  ],
})
export class AppModule {}
