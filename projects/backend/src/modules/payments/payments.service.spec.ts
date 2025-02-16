import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Payment as PrismaPayment } from '@prisma/client';
import { Prisma } from '@prisma/client';
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

  const mockCustomer = {
    id: 'customer_id',
    externalId: 'cus_123',
    name: 'John Doe',
    email: 'john@example.com',
    cpfCnpj: '12345678901',
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

  const mockPaymentGateway = {
    createPayment: jest.fn().mockResolvedValue(mockPayment),
    getPayment: jest.fn().mockResolvedValue(mockPayment),
  };

  const mockPrismaService = {
    $transaction: jest.fn(),
    customer: {
      findUnique: jest.fn().mockResolvedValue(mockCustomer),
    },
    payment: {
      update: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'local_payment_id' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: 'PaymentGateway',
          useValue: mockPaymentGateway,
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
        customerId: 'customer_id',
        value: 100,
        billingType: 'BILL',
        dueDate: '2024-12-31',
      };

      const result = await service.create(createPaymentDto);

      expect(result).toEqual(mockPayment);
      expect(mockPaymentGateway.createPayment).toHaveBeenCalledWith(
        createPaymentDto,
        mockCustomer,
      );
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('should throw error when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValueOnce(null);

      const createPaymentDto: CreatePaymentDto = {
        customerId: 'invalid_id',
        value: 100,
        billingType: 'BILL',
        dueDate: '2024-12-31',
      };

      await expect(service.create(createPaymentDto)).rejects.toThrow(
        'Customer invalid_id não encontrado',
      );
    });

    it('should throw error when creating credit card payment without cpf', async () => {
      const customerWithoutCpf = { ...mockCustomer, cpfCnpj: null };
      mockPrismaService.customer.findUnique.mockResolvedValueOnce(
        customerWithoutCpf,
      );

      const createPaymentDto: CreatePaymentDto = {
        customerId: 'customer_id',
        value: 100,
        billingType: 'CREDIT_CARD',
        dueDate: '2024-12-31',
        creditCard: {
          number: '4111111111111111',
          holderName: 'John Doe',
          expirationMonth: 12,
          expirationYear: 2025,
          ccv: '123',
        },
      };

      await expect(service.create(createPaymentDto)).rejects.toThrow(
        'CPF/CNPJ é obrigatório para pagamentos com cartão de crédito',
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
