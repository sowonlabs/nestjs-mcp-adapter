import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  await app.init();
  await app.listen(3000);

  process.on('SIGINT', async () => {
    console.log('Shutting down application...');
    await app.close();
    process.exit(0);
  });
  
  console.log('HTTP MCP 서버가 시작되었습니다. http://localhost:3000 에서 접근 가능합니다.');
}

bootstrap();
