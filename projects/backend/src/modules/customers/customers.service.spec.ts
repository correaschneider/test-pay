import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AsaasService } from '../../shared/asaas/asaas.service';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './interfaces/customer.interface';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockCustomer: Customer = {
    id: 'cus_123',
    name: 'Test Customer',
    cpfCnpj: '12345678901',
    email: 'test@example.com',
  };

  const mockAsaasService = {
    createCustomer: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ data: mockCustomer })),
    findCustomer: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ data: mockCustomer })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: AsaasService,
          useValue: mockAsaasService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Test Customer',
        cpfCnpj: '12345678901',
        email: 'test@example.com',
      };

      const result = await service.create(createCustomerDto);

      expect(result).toEqual(mockCustomer);
      expect(mockAsaasService.createCustomer).toHaveBeenCalledWith(
        createCustomerDto,
      );
    });

    it('should throw InternalServerErrorException on create error', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Test Customer',
        cpfCnpj: '12345678901',
        email: 'test@example.com',
      };

      mockAsaasService.createCustomer.mockRejectedValue(new Error('API Error'));

      await expect(service.create(createCustomerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findByCpfCnpj', () => {
    it('should find a customer by CPF/CNPJ successfully', async () => {
      const cpfCnpj = '12345678901';

      mockAsaasService.findCustomer.mockResolvedValue({ data: mockCustomer });

      const result = await service.findByCpfCnpj(cpfCnpj);

      expect(result).toEqual(mockCustomer);
      expect(mockAsaasService.findCustomer).toHaveBeenCalledWith(cpfCnpj);
    });

    it('should throw InternalServerErrorException on find error', async () => {
      const cpfCnpj = '12345678901';

      mockAsaasService.findCustomer.mockRejectedValue(new Error('API Error'));

      await expect(service.findByCpfCnpj(cpfCnpj)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
