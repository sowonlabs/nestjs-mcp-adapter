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
  
  console.log('HTTP MCP server started. Accessible at http://localhost:3000');
}

bootstrap();
