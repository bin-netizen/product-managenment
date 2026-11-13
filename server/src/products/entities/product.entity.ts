
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  // ID tự tăng của MySQL
  @PrimaryGeneratedColumn()
  id: number;

  // ID UUID từ Frontend, giữ liên kết với đơn hàng cũ
  @Column({
    name: 'client_id',
    type: 'varchar',
    length: 100,
    nullable: true,
    unique: true,
  })
  clientId: string | null;

  // Tên sản phẩm
  @Column({ type: 'varchar', length: 150 })
  name: string;

  // Danh mục sản phẩm
  @Column({
    type: 'varchar',
    length: 100,
    default: 'Khác',
  })
  category: string;

  // Loại sản phẩm
  @Column({
    name: 'product_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  productType: string | null;

  // Mã sản phẩm
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  sku: string | null;

  // Tình trạng sản phẩm
  @Column({
    name: 'condition_status',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  condition: string | null;

  // Thời gian bảo hành
  @Column({
    name: 'warranty_months',
    type: 'int',
    nullable: true,
  })
  warrantyMonths: number | null;

  // Giá sản phẩm
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  price: number;

  // Số lượng tồn kho
  @Column({
    name: 'stock',
    type: 'int',
    default: 0,
  })
  quantity: number;

  // Hình ảnh chính
  @Column({
    type: 'longtext',
    nullable: true,
  })
  image: string | null;

  // Thư viện ảnh và video
  @Column({
    type: 'json',
    nullable: true,
  })
  media: Record<string, unknown>[] | null;

  // Mô tả
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  // Màu sắc và tồn kho từng màu
  @Column({
    type: 'json',
    nullable: true,
  })
  colors: Record<string, unknown>[] | null;

  // Thông số kỹ thuật
  @Column({
    type: 'json',
    nullable: true,
  })
  specs: Record<string, unknown> | null;

  // Tính năng
  @Column({
    type: 'json',
    nullable: true,
  })
  features: string[] | null;

  // Ngày tạo
  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;
}
