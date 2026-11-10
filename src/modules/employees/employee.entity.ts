import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { toNumber } from '../../common/transformers/bigint-number.transformer.js';
import { EmployeePosition } from './employee-position.enum.js';
import { EmployeeStatus } from './employee-status.enum.js';

@Entity({ name: 'employees' })
export class EmployeeEntity {
  @PrimaryColumn({
    type: 'bigint',
    generated: 'identity',
    generatedIdentity: 'ALWAYS',
    transformer: toNumber,
  })
  id!: number;

  @Column({ name: 'organization_id', type: 'bigint', transformer: toNumber })
  organization_id!: number;

  // No branches table yet, so this stays a plain id with no foreign key.
  @Column({
    name: 'branch_id',
    type: 'bigint',
    nullable: true,
    transformer: toNumber,
  })
  branch_id!: number | null;

  @Column({ type: 'varchar', length: 100 })
  firstname!: string;

  @Column({ type: 'varchar', length: 100 })
  lastname!: string;

  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position!: EmployeePosition | null;

  @Column({ name: 'hired_at', type: 'date', nullable: true })
  hired_at!: string | null;

  @Column({ name: 'terminated_at', type: 'date', nullable: true })
  terminated_at!: string | null;

  @Column({ type: 'varchar', length: 30, default: EmployeeStatus.ACTIVE })
  status!: EmployeeStatus;

  @Column({ type: 'boolean', default: false })
  deleted!: boolean;

  @Column({ name: 'created_by', type: 'bigint', transformer: toNumber })
  created_by!: number;

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
