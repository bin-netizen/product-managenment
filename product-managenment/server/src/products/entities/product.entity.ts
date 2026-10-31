
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  // ID tự tăng, khóa chính
  @PrimaryGeneratedColumn()
  id: number;

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

  // Thời gian bảo hành (tháng)
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

  // Số lượng tồn kho, liên kết với cột stock trong MySQL
  @Column({
    name: 'stock',
    type: 'int',
    default: 0,
  })
  quantity: number;

  // Đường dẫn hình ảnh
  @Column({
    type: 'text',
    nullable: true,
  })
  image: string | null;

  // Mô tả sản phẩm
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  // Danh sách màu sắc và thông tin từng màu
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

  // Danh sách tính năng
  @Column({
    type: 'json',
    nullable: true,
  })
  features: string[] | null;

  // Thời điểm tạo sản phẩm
  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;
}
