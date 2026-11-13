
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
  app.use(
    urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  // Cho phép React truy cập NestJS API
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://product-managenment.vercel.app',
      'https://product-managenment-337zrirmj-zaaabao10112005-8861s-projects.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Sử dụng PORT do Render cấp
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
