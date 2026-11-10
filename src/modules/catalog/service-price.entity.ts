import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { toNumber } from '../../common/transformers/bigint-number.transformer.js';
import { PriceType } from './price-type.enum.js';

@Entity({ name: 'service_prices' })
export class ServicePriceEntity {
  @PrimaryColumn({
    type: 'bigint',
    generated: 'identity',
    generatedIdentity: 'ALWAYS',
    transformer: toNumber,
  })
  id!: number;

  @Column({ name: 'organization_id', type: 'bigint', transformer: toNumber })
  organization_id!: number;

  @Column({ name: 'service_id', type: 'bigint', transformer: toNumber })
  service_id!: number;

  @Column({
    name: 'vehicle_category_id',
    type: 'bigint',
    transformer: toNumber,
  })
  vehicle_category_id!: number;

  @Column({
    name: 'price_type',
    type: 'varchar',
    length: 10,
    default: PriceType.FIXED,
  })
  price_type!: PriceType;

  @Column({ type: 'int' })
  price!: number;

  @Column({ name: 'price_max', type: 'int', nullable: true })
  price_max!: number | null;

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
