import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

import { OrganizationStatus } from '../organizations/organization-status.enum.js';
import { OrganizationEntity } from '../organizations/organization.entity.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { EmployeeQueryDto } from './dto/employee-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeStatus } from './employee-status.enum.js';
import { EmployeeEntity } from './employee.entity.js';

const isForeignKeyViolation = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  'code' in error &&
  error.code === '23503';

const clean = (value: string | null | undefined) => value?.trim() || null;

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employees: Repository<EmployeeEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizations: Repository<OrganizationEntity>,
  ) {}

  async create(dto: CreateEmployeeDto) {
    await this.assertValidOrganization(dto.organization_id);

    const entity = this.employees.create({
      organization_id: dto.organization_id,
      branch_id: dto.branch_id,
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      email: clean(dto.email),
      position: clean(dto.position),
      status: dto.status ?? EmployeeStatus.ACTIVE,
    });

    return this.save(entity);
  }

  async findAll(query: EmployeeQueryDto) {
    const { page, limit, organization_id, branch_id, status, search } = query;
    const where: FindOptionsWhere<EmployeeEntity> = { deleted: false };
    if (organization_id) where.organization_id = organization_id;
    if (branch_id) where.branch_id = branch_id;
    if (status) where.status = status;
    if (search?.trim()) where.name = ILike(`%${search.trim()}%`);

    const [items, total] = await this.employees.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next_page: page * limit < total,
        has_previous_page: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.employees.findOne({
      where: { id, deleted: false },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);
    if (
      dto.organization_id !== undefined &&
      dto.organization_id !== employee.organization_id
    ) {
      await this.assertValidOrganization(dto.organization_id);
    }

    if (dto.organization_id !== undefined) {
      employee.organization_id = dto.organization_id;
    }
    if (dto.branch_id !== undefined) employee.branch_id = dto.branch_id;
    if (dto.name !== undefined) employee.name = dto.name.trim();
    if (dto.phone !== undefined) employee.phone = dto.phone.trim();
    if (dto.email !== undefined) employee.email = clean(dto.email);
    if (dto.position !== undefined) employee.position = clean(dto.position);
    if (dto.status !== undefined) employee.status = dto.status;

    return this.save(employee);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.employees.update(id, { deleted: true });
  }

  private async assertValidOrganization(organization_id: number) {
    const organization = await this.organizations.findOne({
      where: {
        id: organization_id,
        deleted: false,
        status: OrganizationStatus.ACTIVE,
        is_active: true,
      },
      select: { id: true },
    });
    if (!organization) {
      throw new BadRequestException(
        'Organization does not exist or is not active',
      );
    }
  }

  private async save(entity: EmployeeEntity) {
    try {
      return await this.employees.save(entity);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new BadRequestException('Organization or branch does not exist');
      }
      throw error;
    }
  }
}
