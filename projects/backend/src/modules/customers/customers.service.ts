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

  async create(createCustomerDto: CreateCustomerDto): Promise<PrismaCustomer> {
    try {
      const response: { data: Customer } =
        await this.asaasService.createCustomer(createCustomerDto);
      const customer = response.data;

      // Persiste no banco local
      const prismaCustomer = await this.prisma.customer.create({
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

      return prismaCustomer;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao criar o cliente',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Erro ao criar o cliente: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findByCpfCnpj(cpfCnpj: string): Promise<PrismaCustomer> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { cpfCnpj },
        include: {
          payments: true,
        },
      });

      if (!customer) {
        throw new Error('Cliente não encontrado');
      }

      return customer;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao buscar o cliente',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Erro ao buscar o cliente: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
