import { Test, TestingModule } from '@nestjs/testing';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhook } from './interfaces/payment-webhook.interface';
import { Payment } from './interfaces/payment.interface';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const mockPayment: Payment = {
    id: 'pay_123',
    customer: 'cus_123',
    billingType: 'BOLETO',
    value: 100,
    dueDate: '2024-12-31',
    status: 'PENDING',
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

  const mockPaymentsService = {
    create: jest.fn().mockResolvedValue(mockPayment),
    findById: jest.fn().mockResolvedValue(mockPayment),
    handleWebhook: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment', async () => {
      const createPaymentDto: CreatePaymentDto = {
        customer: 'cus_123',
        billingType: 'BOLETO',
        value: 100,
        dueDate: '2024-12-31',
      };

      const result = await controller.create(createPaymentDto);

      expect(result).toEqual(mockPayment);
      expect(mockPaymentsService.create).toHaveBeenCalledWith(createPaymentDto);
    });
  });

  describe('findById', () => {
    it('should find a payment by id', async () => {
      const id = 'pay_123';

      const result = await controller.findById(id);

      expect(result).toEqual(mockPayment);
      expect(mockPaymentsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook notification', async () => {
      await controller.handleWebhook(mockPaymentWebhook);

      expect(mockPaymentsService.handleWebhook).toHaveBeenCalledWith(
        mockPaymentWebhook,
      );
    });
  });
});
