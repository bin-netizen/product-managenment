
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

import { Product } from './entities/product.entity';

interface StockChange {
  productId: string;
  colorId?: string;
  delta: number;
}

interface StockAdjustment {
  operationId: string;
  action: 'deduct' | 'restore';
  changes: StockChange[];
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // Lấy danh sách sản phẩm
  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      order: { id: 'DESC' },
    });
  }

  // Tìm sản phẩm bằng clientId
  async findOne(clientId: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({
      clientId,
    });

    if (!product) {
      throw new NotFoundException(
        `Không tìm thấy sản phẩm ${clientId}`,
      );
    }

    return product;
  }

  // Thêm sản phẩm
  async create(data: Partial<Product>): Promise<Product> {
    const payload = { ...data };

    delete payload.id;

    const product = this.productRepository.create({
      ...payload,
      clientId: data.clientId || randomUUID(),
    });

    return this.productRepository.save(product);
  }

  // Cập nhật sản phẩm bằng clientId
  async update(
    clientId: string,
    data: Partial<Product>,
  ): Promise<Product> {
    const product = await this.findOne(clientId);

    const payload = { ...data };

    delete payload.id;
    delete payload.clientId;

    Object.assign(product, payload);

    return this.productRepository.save(product);
  }

  // Xóa sản phẩm bằng clientId
  async remove(clientId: string): Promise<void> {
    const product = await this.findOne(clientId);

    await this.productRepository.remove(product);
  }

  // Điều chỉnh tồn kho an toàn bằng transaction
  async adjustStock(
    data: StockAdjustment,
  ): Promise<{ success: boolean; duplicate: boolean }> {
    if (
      !data.operationId ||
      !['deduct', 'restore'].includes(data.action) ||
      !Array.isArray(data.changes) ||
      data.changes.length === 0
    ) {
      throw new BadRequestException(
        'Thông tin điều chỉnh tồn kho không hợp lệ',
      );
    }

    for (const change of data.changes) {
      if (
        !change.productId ||
        !Number.isInteger(change.delta) ||
        change.delta === 0
      ) {
        throw new BadRequestException(
          'Thông tin sản phẩm hoặc số lượng thay đổi không hợp lệ',
        );
      }

      if (
        (data.action === 'deduct' && change.delta >= 0) ||
        (data.action === 'restore' && change.delta <= 0)
      ) {
        throw new BadRequestException(
          'Chiều thay đổi tồn kho không khớp với thao tác',
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Ghi nhận mã giao dịch để chống xử lý trùng
      const insertResult = await queryRunner.query(
        `INSERT IGNORE INTO inventory_operations
         (operation_id, action)
         VALUES (?, ?)`,
        [data.operationId, data.action],
      );

      if (insertResult.affectedRows === 0) {
        const existing = await queryRunner.query(
          `SELECT action FROM inventory_operations
           WHERE operation_id = ?`,
          [data.operationId],
        );

        if (
          existing.length > 0 &&
          existing[0].action !== data.action
        ) {
          throw new BadRequestException(
            'Mã giao dịch đã được sử dụng cho thao tác khác',
          );
        }

        await queryRunner.commitTransaction();

        return { success: true, duplicate: true };
      }

      // Gom các thay đổi theo sản phẩm
      const grouped = new Map<string, StockChange[]>();

      for (const change of data.changes) {
        const current = grouped.get(change.productId) || [];
        current.push(change);
        grouped.set(change.productId, current);
      }

      // Sắp xếp ID để giảm nguy cơ deadlock
      const productIds = Array.from(grouped.keys()).sort();

      // Khóa và kiểm tra toàn bộ sản phẩm trước khi cập nhật
      const updates: Array<{
        id: number;
        stock: number;
        colors?: Record<string, unknown>[];
      }> = [];

      for (const productId of productIds) {
        const rows = await queryRunner.query(
          `SELECT id, stock, colors
           FROM products
           WHERE client_id = ?
           FOR UPDATE`,
          [productId],
        );

        if (rows.length === 0) {
          throw new NotFoundException(
            `Không tìm thấy sản phẩm ${productId}`,
          );
        }

        const product = rows[0];

        let colors: Record<string, unknown>[] = [];

        if (product.colors) {
          colors =
            typeof product.colors === 'string'
              ? JSON.parse(product.colors)
              : product.colors;
        }

        const changes = grouped.get(productId)!;

        const tracksColorStock =
          colors.length > 0 &&
          colors.every(
            (color) => typeof color.quantity === 'number',
          );

        if (tracksColorStock) {
          const colorDeltas = new Map<string, number>();

          for (const change of changes) {
            if (!change.colorId) {
              throw new BadRequestException(
                `Sản phẩm ${productId} yêu cầu mã màu khi điều chỉnh kho`,
              );
            }

            const colorExists = colors.some(
              (color) => color.id === change.colorId,
            );

            if (!colorExists) {
              throw new BadRequestException(
                `Không tìm thấy màu ${change.colorId} của sản phẩm ${productId}`,
              );
            }

            colorDeltas.set(
              change.colorId,
              (colorDeltas.get(change.colorId) || 0) +
                change.delta,
            );
          }

          // Tính tồn kho mới của từng màu
          const updatedColors = colors.map((color) => {
            const colorId = String(color.id);
            const delta = colorDeltas.get(colorId) || 0;
            const newQuantity =
              Number(color.quantity) + delta;

            if (newQuantity < 0) {
              throw new BadRequestException(
                `Màu ${colorId} không đủ hàng trong kho`,
              );
            }

            return {
              ...color,
              quantity: newQuantity,
            };
          });

          const totalStock = updatedColors.reduce(
            (sum, color) => sum + Number(color.quantity),
            0,
          );

          updates.push({
            id: product.id,
            stock: totalStock,
            colors: updatedColors,
          });
        } else {
          // Sản phẩm sử dụng kho chung
          const totalDelta = changes.reduce(
            (sum, change) => sum + change.delta,
            0,
          );

          const newStock =
            Number(product.stock) + totalDelta;

          if (newStock < 0) {
            throw new BadRequestException(
              `Sản phẩm ${productId} không đủ hàng trong kho`,
            );
          }

          updates.push({
            id: product.id,
            stock: newStock,
          });
        }
      }

      // Chỉ cập nhật sau khi tất cả sản phẩm đã hợp lệ
      for (const update of updates) {
        if (update.colors) {
          await queryRunner.query(
            `UPDATE products
             SET stock = ?, colors = ?
             WHERE id = ?`,
            [
              update.stock,
              JSON.stringify(update.colors),
              update.id,
            ],
          );
        } else {
          await queryRunner.query(
            `UPDATE products
             SET stock = ?
             WHERE id = ?`,
            [update.stock, update.id],
          );
        }
      }

      await queryRunner.commitTransaction();

      return { success: true, duplicate: false };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
