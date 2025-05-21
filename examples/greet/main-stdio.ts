import { NestFactory } from '@nestjs/core';
import { StdioExpressAdapter } from '../../src/stdio-express-adapter';
import { AppModule } from './app.module';

async function bootstrap() {
  const useLog = false;
  const adapter = new StdioExpressAdapter('/mcp');
  const app = await NestFactory.create(AppModule, adapter, {
    logger: useLog ? ['error', 'warn', 'log', 'debug'] : false,
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
