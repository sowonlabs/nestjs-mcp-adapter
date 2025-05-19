import { NestFactory } from '@nestjs/core';
import { StdioExpressAdapter } from '../../src/stdio-express-adapter';
import { AppModule } from './app.module';

async function bootstrap() {
  const useLog = false;
  const adapter = new StdioExpressAdapter('/mcp/mcp-calculator');
  const app = await NestFactory.create(AppModule, adapter, {
    logger: useLog ? ['error', 'warn', 'log'] : false,
  });

  await app.init();
  await app.listen(0); // 실제로 바인딩하지 않음

  process.on('SIGINT', async () => {
    console.log('Shutting down application...');
    await app.close();
    process.exit(0);
  });

  console.log('STDIO MCP server started.');
}

bootstrap();
