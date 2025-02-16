import { Customer as PrismaCustomer } from '@prisma/client';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { Payment } from './payment.interface';

export interface PaymentGateway {
  createPayment(
    data: CreatePaymentDto,
    customer: PrismaCustomer,
  ): Promise<Payment>;
  getPayment(id: string): Promise<Payment>;
}
