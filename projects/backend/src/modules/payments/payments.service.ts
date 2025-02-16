import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Payment as PrismaPayment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AsaasService } from '../../shared/asaas/asaas.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhook } from './interfaces/payment-webhook.interface';
import { Payment } from './interfaces/payment.interface';

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

      const response: { data: Payment } = await this.asaasService.createPayment(
        {
          ...createPaymentDto,
          customer: customer?.externalId,
        },
      );
      const payment: Payment = response.data;

      if (!customer) {
        throw new Error(
          `Customer with externalId ${payment.customer} not found`,
        );
      }

      // Persiste no banco local
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
      this.logger.error(
        'Error creating payment',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Error creating payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findById(id: string): Promise<Payment> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new Error(`Payment with id ${id} not found`);
      }

      const response: { data: Payment } = await this.asaasService.getPayment(
        payment.externalId,
      );
      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        'Error finding payment',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Error finding payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async handleWebhook(webhook: PaymentWebhook): Promise<void> {
    this.logger.log(
      `Received webhook: ${webhook.event} for payment ${webhook.payment.id}`,
    );

    try {
      const response: { data: Payment } = await this.asaasService.getPayment(
        webhook.payment.id,
      );
      if (!response.data) {
        throw new InternalServerErrorException(
          `Payment ${webhook.payment.id} not found in Asaas`,
        );
      }

      if (response.data.status !== 'RECEIVED') {
        throw new InternalServerErrorException(
          `Payment ${webhook.payment.id} status is not RECEIVED`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error finding payment in Asaas: ${webhook.payment.id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException('Error finding payment in Asaas');
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

      this.logger.log(`Payment ${webhook.payment.id} updated successfully`);
    } catch (error: unknown) {
      this.logger.error(
        `Error processing webhook for payment ${webhook.payment.id}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new InternalServerErrorException('Error processing webhook');
    }
  }
}
