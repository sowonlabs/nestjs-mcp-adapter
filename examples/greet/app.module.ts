import { Module } from '@nestjs/common';
import { McpAdapterModule } from '../../src/mcp-adapter.module';
import { GreetToolService } from './greet.tool';
import { McpController } from './mcp.controller';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    McpAdapterModule.forRoot(),
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
