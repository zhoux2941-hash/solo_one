import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Supply Chain Traceability Backend is running on: http://localhost:${port}`);
}
bootstrap();
