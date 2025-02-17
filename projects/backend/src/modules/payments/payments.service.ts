import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Payment as PrismaPayment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AxiosError } from 'axios';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentGateway } from './interfaces/payment-gateway.interface';
import { PaymentWebhook } from './interfaces/payment-webhook.interface';
import { Payment } from './interfaces/payment.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('PaymentGateway')
    private readonly paymentGateway: PaymentGateway,
    private readonly prisma: PrismaService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<PrismaPayment> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: createPaymentDto.customerId },
      });

      if (!customer) {
        throw new Error(
          `Customer ${createPaymentDto.customerId} não encontrado`,
        );
      }

      if (createPaymentDto.billingType === 'CREDIT_CARD' && !customer.cpfCnpj) {
        throw new Error(
          'CPF/CNPJ é obrigatório para pagamentos com cartão de crédito',
        );
      }

      const payment = await this.paymentGateway.createPayment(
        createPaymentDto,
        customer,
      );

      const createdPayment = await this.prisma.payment.create({
        data: {
          externalId: payment.id,
          customerId: customer.id,
          value: payment.value,
          status: payment.status,
          billingType: createPaymentDto.billingType,
          dueDate: new Date(payment.dueDate),
          description: payment.description,
          bankSlipUrl: payment.bankSlipUrl,
          pixQrCode: payment.pixQrCode,
          gatewayResponse: payment as unknown as Prisma.InputJsonValue,
        },
      });

      return createdPayment;
    } catch (error: unknown) {
      const asaasError = error as AxiosError<{
        errors: Array<{ description: string }>;
      }>;
      const errorMessage =
        asaasError.response?.data?.errors?.[0]?.description ||
        (error instanceof Error ? error.message : 'Unknown error');

      this.logger.error(
        'Erro ao criar o pagamento',
        error instanceof Error ? error.stack : 'Unknown error',
        { error: asaasError.response?.data },
      );

      throw new InternalServerErrorException(
        `Erro ao criar o pagamento: ${errorMessage}`,
      );
    }
  }

  async findById(
    id: string,
  ): Promise<PrismaPayment & { gatewayResponse: Prisma.JsonValue }> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new Error(`Pagamento ${id} não encontrado`);
      }

      const response: Payment = await this.paymentGateway.getPayment(
        payment.externalId,
      );
      return {
        ...payment,
        gatewayResponse: response as unknown as Prisma.JsonValue,
      };
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao buscar o pagamento',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Erro ao buscar o pagamento: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findByCustomerId(customerId: string): Promise<PrismaPayment[]> {
    return this.prisma.payment.findMany({
      where: { customerId },
    });
  }

  async handleWebhook(webhook: PaymentWebhook): Promise<void> {
    this.logger.log(
      `Recebido webhook: ${webhook.event} para o pagamento ${webhook.payment.id}`,
    );

    let payment: Payment;
    try {
      payment = await this.paymentGateway.getPayment(webhook.payment.id);

      if (!payment) {
        throw new InternalServerErrorException(
          `Pagamento ${webhook.payment.id} não encontrado no gateway`,
        );
      }

      if (payment.status !== 'RECEIVED') {
        throw new InternalServerErrorException(
          `Pagamento ${webhook.payment.id} não está com status RECEIVED`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar o pagamento no gateway: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Erro ao buscar o pagamento no gateway: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    console.log(payment);

    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const prismaPayment: PrismaPayment = await tx.payment.update({
          where: { externalId: webhook.payment.id },
          data: {
            status: payment.status,
            paidAt: payment.paymentDate ? new Date(payment.paymentDate) : null,
          },
        });
        return prismaPayment;
      });

      this.logger.log(`Pagamento ${webhook.payment.id} atualizado com sucesso`);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao processar o webhook para o pagamento ${webhook.payment.id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Erro ao processar o webhook para o pagamento ${webhook.payment.id}`,
      );
    }
  }
}
