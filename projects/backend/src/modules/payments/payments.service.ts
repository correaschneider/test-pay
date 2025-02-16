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

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
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

      await this.prisma.payment.create({
        data: {
          externalId: payment.id,
          customerId: customer.id,
          value: payment.value,
          status: payment.status,
          billingType: payment.billingType,
          dueDate: new Date(payment.dueDate),
          description: payment.description,
          bankSlipUrl: payment.bankSlipUrl,
          pixQrCode: payment.pixQrCode,
        },
      });

      return payment;
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

  async findById(id: string): Promise<Payment> {
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
      return response;
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

  async handleWebhook(webhook: PaymentWebhook): Promise<void> {
    this.logger.log(
      `Recebido webhook: ${webhook.event} para o pagamento ${webhook.payment.id}`,
    );

    try {
      const response: Payment = await this.paymentGateway.getPayment(
        webhook.payment.id,
      );
      if (!response) {
        throw new InternalServerErrorException(
          `Pagamento ${webhook.payment.id} não encontrado na Asaas`,
        );
      }

      if (response.status !== 'RECEIVED') {
        throw new InternalServerErrorException(
          `Pagamento ${webhook.payment.id} não está com status RECEIVED`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar o pagamento na Asaas: ${webhook.payment.id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Erro ao buscar o pagamento na Asaas: ${webhook.payment.id}`,
      );
    }

    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const payment: PrismaPayment = await tx.payment.update({
          where: { externalId: webhook.payment.id },
          data: {
            status: webhook.payment.status,
            paidAt: webhook.payment.paymentDate
              ? new Date(webhook.payment.paymentDate)
              : null,
          },
        });
        return payment;
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
