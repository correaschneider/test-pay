import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Payment as PrismaPayment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AsaasService } from '../../shared/asaas/asaas.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhook } from './interfaces/payment-webhook.interface';
import { Payment } from './interfaces/payment.interface';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPayment: Payment = {
    id: 'pay_123',
    customer: 'cus_123',
    value: 100,
    billingType: 'BOLETO',
    status: 'PENDING',
    dueDate: '2024-12-31',
    description: 'Test payment',
  };

  const mockPaymentWebhook: PaymentWebhook = {
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'pay_123',
      customer: 'cus_123',
      value: 100,
      netValue: 97,
      billingType: 'BOLETO',
      status: 'RECEIVED',
      dueDate: '2024-12-31',
      paymentDate: '2024-12-30',
    },
  };

  const mockAsaasService = {
    createPayment: jest.fn().mockResolvedValue({ data: mockPayment }),
    getPayment: jest.fn().mockResolvedValue({ data: mockPayment }),
  };

  const mockPrismaService = {
    $transaction: jest.fn(),
    payment: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: AsaasService,
          useValue: mockAsaasService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('create', () => {
    it('should create a payment successfully', async () => {
      const createPaymentDto: CreatePaymentDto = {
        customer: 'cus_123',
        value: 100,
        billingType: 'BOLETO',
        dueDate: '2024-12-31',
        description: 'Test payment',
      };

      mockAsaasService.createPayment.mockResolvedValue({ data: mockPayment });

      const result = await service.create(createPaymentDto);

      expect(result).toEqual(mockPayment);
      expect(mockAsaasService.createPayment).toHaveBeenCalledWith(
        createPaymentDto,
      );
    });

    it('should throw InternalServerErrorException on create error', async () => {
      const createPaymentDto: CreatePaymentDto = {
        customer: 'cus_123',
        value: 100,
        billingType: 'BOLETO',
        dueDate: '2024-12-31',
      };

      mockAsaasService.createPayment.mockRejectedValue(new Error('API Error'));

      await expect(service.create(createPaymentDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findById', () => {
    it('should find a payment by ID successfully', async () => {
      const paymentId = 'pay_123';

      mockAsaasService.getPayment.mockResolvedValue({ data: mockPayment });

      const result = await service.findById(paymentId);

      expect(result).toEqual(mockPayment);
      expect(mockAsaasService.getPayment).toHaveBeenCalledWith(paymentId);
    });

    it('should throw InternalServerErrorException on find error', async () => {
      const paymentId = 'pay_123';

      mockAsaasService.getPayment.mockRejectedValue(new Error('API Error'));

      await expect(service.findById(paymentId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('handleWebhook', () => {
    it('should update payment status successfully', async () => {
      mockPrismaService.$transaction.mockImplementation(
        async (
          callback: (tx: Prisma.TransactionClient) => Promise<PrismaPayment>,
        ) => {
          return callback(
            mockPrismaService as unknown as Prisma.TransactionClient,
          );
        },
      );
      mockPrismaService.payment.update.mockResolvedValue({
        id: 'internal_id',
        externalId: mockPaymentWebhook.payment.id,
        status: mockPaymentWebhook.payment.status,
        paidAt: mockPaymentWebhook.payment.paymentDate
          ? new Date(mockPaymentWebhook.payment.paymentDate)
          : null,
      } as PrismaPayment);

      await service.handleWebhook(mockPaymentWebhook);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { externalId: mockPaymentWebhook.payment.id },
        data: {
          status: mockPaymentWebhook.payment.status,
          paidAt: mockPaymentWebhook.payment.paymentDate
            ? new Date(mockPaymentWebhook.payment.paymentDate)
            : null,
        },
      });
    });

    it('should throw InternalServerErrorException when database update fails', async () => {
      mockPrismaService.$transaction.mockImplementation(
        async (
          callback: (tx: Prisma.TransactionClient) => Promise<PrismaPayment>,
        ) => {
          return callback(
            mockPrismaService as unknown as Prisma.TransactionClient,
          );
        },
      );
      mockPrismaService.payment.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.handleWebhook(mockPaymentWebhook)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
