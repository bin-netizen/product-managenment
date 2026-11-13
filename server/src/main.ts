
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Tăng giới hạn dữ liệu JSON lên 10 MB
  app.use(json({ limit: '10mb' }));

  // Hỗ trợ dữ liệu form
  app.use(urlencoded({
    extended: true,
    limit: '10mb',
  }));

  // Cho phép React truy cập NestJS API
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
