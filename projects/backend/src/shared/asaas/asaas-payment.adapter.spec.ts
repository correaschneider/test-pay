import { Test, TestingModule } from '@nestjs/testing';
import type { Customer as PrismaCustomer } from '@prisma/client';
import { CreatePaymentDto } from '../../modules/payments/dto/create-payment.dto';
import { Payment } from '../../modules/payments/interfaces/payment.interface';
import { AsaasPaymentAdapter } from './asaas-payment.adapter';
import { AsaasService } from './asaas.service';

describe('AsaasPaymentAdapter', () => {
  let adapter: AsaasPaymentAdapter;

  const mockPayment: Payment = {
    id: 'pay_123',
    customer: 'cus_123',
    value: 100,
    billingType: 'BOLETO',
    status: 'PENDING',
    dueDate: '2024-12-31',
  };

  const mockCustomer = {
    id: 'customer_id',
    externalId: 'cus_123',
    name: 'John Doe',
    email: 'john@example.com',
    cpfCnpj: '12345678901',
  };

  const mockAsaasService = {
    createPayment: jest.fn().mockResolvedValue({ data: mockPayment }),
    getPayment: jest.fn().mockResolvedValue({ data: mockPayment }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsaasPaymentAdapter,
        {
          provide: AsaasService,
          useValue: mockAsaasService,
        },
      ],
    }).compile();

    adapter = module.get<AsaasPaymentAdapter>(AsaasPaymentAdapter);
  });

  describe('createPayment', () => {
    it('should create a payment with boleto', async () => {
      const createPaymentDto: CreatePaymentDto = {
        customerId: 'customer_id',
        value: 100,
        billingType: 'BILL',
        dueDate: '2024-12-31',
      };

      const result = await adapter.createPayment(
        createPaymentDto,
        mockCustomer as PrismaCustomer,
      );

      expect(result).toEqual(mockPayment);
      expect(mockAsaasService.createPayment).toHaveBeenCalledWith({
        customer: mockCustomer.externalId,
        value: 100,
        billingType: 'BOLETO',
        dueDate: '2024-12-31',
      });
    });

    it('should create a payment with credit card', async () => {
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

      const result = await adapter.createPayment(
        createPaymentDto,
        mockCustomer as PrismaCustomer,
      );

      expect(result).toEqual(mockPayment);
      expect(mockAsaasService.createPayment).toHaveBeenCalledWith({
        customer: mockCustomer.externalId,
        value: 100,
        billingType: 'CREDIT_CARD',
        dueDate: '2024-12-31',
        creditCard: createPaymentDto.creditCard,
        creditCardHolderInfo: {
          name: 'John Doe',
          email: mockCustomer.email,
          cpfCnpj: mockCustomer.cpfCnpj,
        },
      });
    });
  });

  describe('getPayment', () => {
    it('should get a payment by id', async () => {
      const result = await adapter.getPayment('pay_123');

      expect(result).toEqual(mockPayment);
      expect(mockAsaasService.getPayment).toHaveBeenCalledWith('pay_123');
    });
  });
});
