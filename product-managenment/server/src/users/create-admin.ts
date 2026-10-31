
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../app.module';
import { User } from './entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userRepository = app.get(getRepositoryToken(User));

    const email = 'admin@example.com';
    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      console.log('Tài khoản Admin đã tồn tại!');
      return;
    }

    const password = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = userRepository.create({
      name: 'Administrator',
      email,
      password: hashedPassword,
      role: 'admin',
    });

    await userRepository.save(admin);

    console.log('Tạo tài khoản Admin thành công!');
    console.log('Email:', email);
  } finally {
    await app.close();
  }
}

bootstrap();
