import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { AsaasService } from './asaas.service';

describe('AsaasService', () => {
  let service: AsaasService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'asaas.apiKey':
          return 'test_api_key';
        case 'asaas.apiUrl':
          return 'https://test.api.com';
        default:
          return null;
      }
    }),
  };

  const mockAxiosResponse: AxiosResponse = {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as import('axios').InternalAxiosRequestConfig,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsaasService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AsaasService>(AsaasService);
    configService = module.get<ConfigService>(ConfigService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with config values', () => {
    expect(configService.get('asaas.apiKey')).toBe('test_api_key');
    expect(configService.get('asaas.apiUrl')).toBe('https://test.api.com');
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const customerData = { name: 'Test Customer' };
      const post = jest
        .spyOn(service['api'], 'post')
        .mockImplementation(() => Promise.resolve(mockAxiosResponse));

      const result = await service.createCustomer(customerData);
      expect(result.status).toBe(200);
      expect(post).toHaveBeenCalledWith('/customers', customerData);
    });
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
      const paymentData = { value: 100 };
      const post = jest
        .spyOn(service['api'], 'post')
        .mockImplementation(() => Promise.resolve(mockAxiosResponse));

      const result = await service.createPayment(paymentData);
      expect(result.status).toBe(200);
      expect(post).toHaveBeenCalledWith('/payments', paymentData);
    });
  });

  describe('getPayment', () => {
    it('should get a payment', async () => {
      const paymentId = 'payment_123';
      const get = jest
        .spyOn(service['api'], 'get')
        .mockImplementation(() => Promise.resolve(mockAxiosResponse));

      const result = await service.getPayment(paymentId);
      expect(result.status).toBe(200);
      expect(get).toHaveBeenCalledWith(`/payments/${paymentId}`);
    });
  });
});
