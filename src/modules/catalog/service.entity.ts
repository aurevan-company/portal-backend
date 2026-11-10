import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { toNumber } from '../../common/transformers/bigint-number.transformer.js';
import { ServiceType } from './service-type.enum.js';

// organization_id IS NULL = system row (managed by seed, read-only via API).
@Entity({ name: 'services' })
export class ServiceEntity {
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

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: ServiceType.SERVICE })
  type!: ServiceType;

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
