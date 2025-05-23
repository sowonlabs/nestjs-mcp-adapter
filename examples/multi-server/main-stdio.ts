import { NestFactory } from '@nestjs/core';
import { StdioExpressAdapter, StderrLogger } from '@sowonai/nest-mcp-adapter';
import { AppModule } from './app.module';

async function bootstrap() {
  const useLog = true;
  const adapter = new StdioExpressAdapter('/mcp/calculator');
  const logger = new StderrLogger('MultiServer', { timestamp: true });
  const app = await NestFactory.create(AppModule, adapter, {
    logger: useLog ? logger : false,
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down application...');
    await app.close();
    await adapter.close();
    process.exit(0);
  });

  await app.init();
  await app.listen(0); // Not bind actually
}

bootstrap();
