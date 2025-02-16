import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Customer as PrismaCustomer } from '@prisma/client';
import { AsaasService } from '../../shared/asaas/asaas.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './interfaces/customer.interface';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly asaasService: AsaasService,
    private readonly prisma: PrismaService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    try {
      const response: { data: Customer } =
        await this.asaasService.createCustomer(createCustomerDto);
      const customer = response.data;

      // Persiste no banco local
      await this.prisma.customer.create({
        data: {
          externalId: customer.id,
          name: customer.name,
          cpfCnpj: customer.cpfCnpj,
          email: customer.email,
          phone: customer.phone,
          mobilePhone: customer.mobilePhone,
          address: customer.address,
          addressNumber: customer.addressNumber,
          complement: customer.complement,
          province: customer.province,
          postalCode: customer.postalCode,
        },
      });

      return customer;
    } catch (error: unknown) {
      this.logger.error(
        'Error creating customer',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Error creating customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findByCpfCnpj(cpfCnpj: string): Promise<Customer> {
    try {
      const response: { data: Customer } =
        await this.asaasService.findCustomer(cpfCnpj);
      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        'Error finding customer',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Error finding customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findLocalByCpfCnpj(cpfCnpj: string): Promise<PrismaCustomer> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { cpfCnpj },
        include: {
          payments: true,
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    } catch (error: unknown) {
      this.logger.error(
        'Error finding local customer',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Error finding local customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    name?: string;
    cpfCnpj?: string;
  }): Promise<PrismaCustomer[]> {
    const { skip, take, name, cpfCnpj } = params;

    try {
      return await this.prisma.customer.findMany({
        skip,
        take,
        where: {
          AND: [
            name ? { name: { contains: name } } : {},
            cpfCnpj ? { cpfCnpj: { contains: cpfCnpj } } : {},
          ],
        },
        include: {
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        'Error finding customers',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Error finding customers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
