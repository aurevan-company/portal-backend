import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployeeStatus } from './employee-status.enum.js';

@Entity({ name: 'employees' })
export class EmployeeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organization_id', type: 'int' })
  organization_id!: number;

  @Column({ name: 'branch_id', type: 'int' })
  branch_id!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position!: string | null;

  @Column({ type: 'varchar', length: 20, default: EmployeeStatus.ACTIVE })
  status!: EmployeeStatus;

  @Column({ type: 'boolean', default: false })
  deleted!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;
}
