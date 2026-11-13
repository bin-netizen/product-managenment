
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

import { Product } from './entities/product.entity';
import { InventoryOperation } from './entities/inventory-operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      InventoryOperation,
    ]),
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
