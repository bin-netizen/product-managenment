import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
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

  // GET /products: lấy danh sách sản phẩm
  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  // GET /products/1: lấy một sản phẩm
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // POST /products: thêm sản phẩm
  @Post()
  create(@Body() body: Partial<Product>) {
    return this.productsService.create(body);
  }

  // PATCH /products/1: cập nhật sản phẩm
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<Product>,
  ) {
    return this.productsService.update(id, body);
  }

  // DELETE /products/1: xóa sản phẩm
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
