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

  async create(dto: CreateEmployeeDto, current_user_id: number) {
    await this.assertValidOrganization(dto.organization_id);
    this.assertValidDates(dto.hired_at, dto.terminated_at);

    const entity = this.employees.create({
      organization_id: dto.organization_id,
      branch_id: dto.branch_id ?? null,
      firstname: dto.firstname.trim(),
      lastname: dto.lastname.trim(),
      phone: dto.phone.trim(),
      email: clean(dto.email),
      position: dto.position ?? null,
      hired_at: dto.hired_at ?? null,
      terminated_at: dto.terminated_at ?? null,
      status: dto.status ?? EmployeeStatus.ACTIVE,
      created_by: current_user_id,
    });

    return this.save(entity);
  }

  async findAll(query: EmployeeQueryDto) {
    const { page, limit, organization_id, branch_id, status, position, search } =
      query;
    const base: FindOptionsWhere<EmployeeEntity> = { deleted: false };
    if (organization_id) base.organization_id = organization_id;
    if (branch_id) base.branch_id = branch_id;
    if (status) base.status = status;
    if (position) base.position = position;

    const term = search?.trim();
    const where: FindOptionsWhere<EmployeeEntity>[] = term
      ? [
          { ...base, firstname: ILike(`%${term}%`) },
          { ...base, lastname: ILike(`%${term}%`) },
          { ...base, phone: ILike(`%${term}%`) },
        ]
      : [base];

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

  async update(id: number, dto: UpdateEmployeeDto, current_user_id: number) {
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
    if (dto.firstname !== undefined) employee.firstname = dto.firstname.trim();
    if (dto.lastname !== undefined) employee.lastname = dto.lastname.trim();
    if (dto.phone !== undefined) employee.phone = dto.phone.trim();
    if (dto.email !== undefined) employee.email = clean(dto.email);
    if (dto.position !== undefined) employee.position = dto.position;
    if (dto.hired_at !== undefined) employee.hired_at = dto.hired_at;
    if (dto.terminated_at !== undefined) {
      employee.terminated_at = dto.terminated_at;
    }
    if (dto.status !== undefined) employee.status = dto.status;

    this.assertValidDates(employee.hired_at, employee.terminated_at);
    employee.updated_by = current_user_id;

    return this.save(employee);
  }

  async remove(id: number, current_user_id: number) {
    await this.findOne(id);
    await this.employees.update(id, {
      deleted: true,
      updated_by: current_user_id,
    });
  }

  private assertValidDates(
    hired_at: string | null | undefined,
    terminated_at: string | null | undefined,
  ) {
    if (hired_at && terminated_at && terminated_at < hired_at) {
      throw new BadRequestException(
        'terminated_at must not be earlier than hired_at',
      );
    }
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
