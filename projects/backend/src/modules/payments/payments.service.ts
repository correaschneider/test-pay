import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Payment as PrismaPayment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AxiosError } from 'axios';
import { AsaasService } from '../../shared/asaas/asaas.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AsaasPaymentDto } from './interfaces/asaas-payment.interface';
import { PaymentWebhook } from './interfaces/payment-webhook.interface';
import { Payment } from './interfaces/payment.interface';
import { BillingTypeTransformer } from './transformers/billing-type.transformer';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly asaasService: AsaasService,
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { customerId, ...paymentData } = createPaymentDto;
      const asaasPaymentDto: AsaasPaymentDto = {
        ...paymentData,
        billingType: BillingTypeTransformer.toAsaas(
          createPaymentDto.billingType,
        ),
        customer: customer.externalId,
      };

      if (asaasPaymentDto.billingType === 'CREDIT_CARD') {
        asaasPaymentDto.creditCardHolderInfo = {
          name: createPaymentDto?.creditCard?.holderName || customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj,
        };
      }

      const response: { data: Payment } =
        await this.asaasService.createPayment(asaasPaymentDto);
      const payment = response.data;

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

      const response: { data: Payment } = await this.asaasService.getPayment(
        payment.externalId,
      );
      return response.data;
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
      const response: { data: Payment } = await this.asaasService.getPayment(
        webhook.payment.id,
      );
      if (!response.data) {
        throw new InternalServerErrorException(
          `Pagamento ${webhook.payment.id} não encontrado na Asaas`,
        );
      }

      if (response.data.status !== 'RECEIVED') {
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
