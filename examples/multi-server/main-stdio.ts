import { NestFactory } from '@nestjs/core';
import { StdioExpressAdapter, StderrLogger } from '@sowonai/nest-mcp-adapter';
import { AppModule } from './app.module';

async function bootstrap() {
  const useLog = true; // 로깅 활성화
  const adapter = new StdioExpressAdapter('/mcp');
  // StderrLogger 인스턴스 생성
  const logger = new StderrLogger('MultiServer', { timestamp: true }); 
  const app = await NestFactory.create(AppModule, adapter, {
    // logger 옵션에 StderrLogger 인스턴스 전달
    logger: useLog ? logger : false, 
  });

  await app.init();
  await app.listen(0); // Not bind actually

  process.on('SIGINT', async () => {
    console.log('Shutting down application...');
    await app.close();
    await adapter.close();
    process.exit(0);
  });

  console.log('STDIO MCP server started.');
}

bootstrap();
