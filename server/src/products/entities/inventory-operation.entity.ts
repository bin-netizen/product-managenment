
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('inventory_operations')
export class InventoryOperation {
  // Mã giao dịch duy nhất, do Frontend tạo
  @PrimaryColumn({
    name: 'operation_id',
    type: 'varchar',
    length: 100,
  })
  operationId: string;

  // Loại giao dịch: deduct hoặc restore
  @Column({
    type: 'varchar',
    length: 20,
  })
  action: string;

  // Thời điểm xử lý
  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;
}
