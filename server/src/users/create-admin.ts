
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../app.module';
import { User } from './entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userRepository = app.get(getRepositoryToken(User));

    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error('Thiếu ADMIN_NAME, ADMIN_EMAIL hoặc ADMIN_PASSWORD trong .env');
    }

    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      console.log('Tài khoản Admin đã tồn tại:', email);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    await userRepository.save(admin);

    console.log('Tạo tài khoản Admin thành công!');
    console.log('Email:', email);
    console.log('Role: admin');
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Không thể tạo tài khoản Admin:', error);
  process.exitCode = 1;
});
