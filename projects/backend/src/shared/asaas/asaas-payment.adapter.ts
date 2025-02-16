import { Injectable } from '@nestjs/common';
import { Customer as PrismaCustomer } from '@prisma/client';
import { CreatePaymentDto } from '../../modules/payments/dto/create-payment.dto';
import { PaymentGateway } from '../../modules/payments/interfaces/payment-gateway.interface';
import { Payment } from '../../modules/payments/interfaces/payment.interface';
import { AsaasPaymentDto } from './asaas-payment.dto';
import { AsaasService } from './asaas.service';
import { BillingTypeTransformer } from './billing-type.transformer';

@Injectable()
export class AsaasPaymentAdapter implements PaymentGateway {
  constructor(private readonly asaasService: AsaasService) {}

  async createPayment(
    data: CreatePaymentDto,
    customer: PrismaCustomer,
  ): Promise<Payment> {
    const asaasPaymentDto: AsaasPaymentDto = {
      ...data,
      billingType: BillingTypeTransformer.toAsaas(data.billingType),
      customer: customer.externalId,
    };

    if (asaasPaymentDto.billingType === 'CREDIT_CARD') {
      asaasPaymentDto.creditCardHolderInfo = {
        name: data.creditCard?.holderName || customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj,
      };
    }

    const response = await this.asaasService.createPayment(asaasPaymentDto);
    return response.data as Payment;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await this.asaasService.getPayment(id);
    return response.data as Payment;
  }
}
