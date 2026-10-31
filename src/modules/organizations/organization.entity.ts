import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity.js';
import { OrganizationStatus } from './organization-status.enum.js';

// pg returns BIGINT and DECIMAL as strings; expose them as numbers in JSON.
const toNumber = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'organizations' })
export class OrganizationEntity {
  @PrimaryGeneratedColumn('identity', {
    type: 'bigint',
    generatedIdentity: 'ALWAYS',
    transformer: toNumber,
  })
  id!: number;

  @Column({ name: 'owner_id', type: 'bigint', transformer: toNumber })
  owner_id!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_id' })
  owner?: UserEntity;

  @Column({
    name: 'parent_id',
    type: 'bigint',
    nullable: true,
    transformer: toNumber,
  })
  parent_id!: number | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'parent_id' })
  parent?: OrganizationEntity;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logo_url!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: toNumber,
  })
  latitude!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: toNumber,
  })
  longitude!: number | null;

  @Column({
    name: 'google_place_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  google_place_id!: string | null;

  @Column({ name: 'facebook_url', type: 'text', nullable: true })
  facebook_url!: string | null;

  @Column({ name: 'instagram_url', type: 'text', nullable: true })
  instagram_url!: string | null;

  @Column({ name: 'working_hours', type: 'jsonb', nullable: true })
  working_hours!: Record<string, unknown> | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: OrganizationStatus.PENDING,
  })
  status!: OrganizationStatus;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

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
