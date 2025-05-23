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

  const cleanup = async () => {
    await adapter.close();
    await app.close();
  };

  const shutdownHandler = async (signal: string) => {
    logger.log(`Shutting down application... (${signal})`);
    await cleanup();
    process.exit(0);
  };

  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => shutdownHandler(signal));
  });

  await app.init();
  await app.listen(0); // Not bind actually
}

bootstrap();
