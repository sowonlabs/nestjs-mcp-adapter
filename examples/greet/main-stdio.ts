import { NestFactory } from '@nestjs/core';
import { StdioExpressAdapter, StderrLogger } from '@sowonai/nest-mcp-adapter';
import { AppModule } from './app.module';

async function bootstrap() {
  const useLog = true;
  const adapter = new StdioExpressAdapter('/mcp');
  const logger = new StderrLogger('Greet', { timestamp: true });
  const app = await NestFactory.create(AppModule, adapter, {
    logger: useLog ? logger : false,
  });

  await app.init();
  await app.listen(0); // Not bind actually

  process.on('SIGINT', async () => {
    console.log('Shutting down application...');
    await adapter.close();
    await app.close();
    process.exit(0);
  });

  console.log('STDIO MCP server started.');
}

bootstrap();
