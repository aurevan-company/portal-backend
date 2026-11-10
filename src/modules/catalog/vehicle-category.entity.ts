import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { toNumber } from '../../common/transformers/bigint-number.transformer.js';

// organization_id IS NULL = system row (managed by seed, read-only via API).
@Entity({ name: 'vehicle_categories' })
export class VehicleCategoryEntity {
  @PrimaryColumn({
    type: 'bigint',
    generated: 'identity',
    generatedIdentity: 'ALWAYS',
    transformer: toNumber,
  })
  id!: number;

  @Column({
    name: 'organization_id',
    type: 'bigint',
    nullable: true,
    transformer: toNumber,
  })
  organization_id!: number | null;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  deleted!: boolean;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true,
    transformer: toNumber,
  })
  created_by!: number | null;

  @Column({
    name: 'updated_by',
    type: 'bigint',
    nullable: true,
    transformer: toNumber,
  })
  updated_by!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;
}
