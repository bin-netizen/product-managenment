
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  // Lấy danh sách sản phẩm
  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  // Điều chỉnh tồn kho
  @Post('stock-adjustments')
  adjustStock(
    @Body()
    body: {
      operationId: string;
      action: 'deduct' | 'restore';
      changes: {
        productId: string;
        colorId?: string;
        delta: number;
      }[];
    },
  ): Promise<{ success: boolean; duplicate: boolean }> {
    return this.productsService.adjustStock(body);
  }

  // Tìm sản phẩm bằng clientId
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  // Thêm sản phẩm
  @Post()
  create(@Body() body: Partial<Product>): Promise<Product> {
    return this.productsService.create(body);
  }

  // Cập nhật sản phẩm
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<Product>,
  ): Promise<Product> {
    return this.productsService.update(id, body);
  }

  // Xóa sản phẩm
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
