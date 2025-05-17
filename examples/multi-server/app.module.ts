import { Module } from '@nestjs/common';
import { McpAdapterModule } from '../../src/mcp-adapter.module';
import { CalculatorToolService } from './calculator.tool';
import { UsersResourceService } from './users.resource';
import { McpController } from './mcp.controller';
import { HelloController } from './hello.controller';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    McpAdapterModule.forRoot(),
  ],
  controllers: [
    HelloController,
    McpController,
  ],
  providers: [
    CalculatorToolService,
    UsersResourceService,
    AuthGuard,
  ],
})
export class AppModule {}
