import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './interfaces/customer.interface';

describe('CustomersController', () => {
  let controller: CustomersController;

  const mockCustomer: Customer = {
    id: 'cus_123',
    name: 'Test Customer',
    cpfCnpj: '12345678901',
    email: 'test@example.com',
  };

  const mockCustomersService = {
    create: jest.fn().mockImplementation(() => Promise.resolve(mockCustomer)),
    findByCpfCnpj: jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockCustomer)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Test Customer',
        cpfCnpj: '12345678901',
        email: 'test@example.com',
      };

      const result = await controller.create(createCustomerDto);
      expect(result).toEqual(mockCustomer);
      expect(mockCustomersService.create).toHaveBeenCalledWith(
        createCustomerDto,
      );
    });
  });

  describe('findByCpfCnpj', () => {
    it('should find a customer by CPF/CNPJ', async () => {
      const cpfCnpj = '12345678901';

      const result = await controller.findByCpfCnpj(cpfCnpj);
      expect(result).toEqual(mockCustomer);
      expect(mockCustomersService.findByCpfCnpj).toHaveBeenCalledWith(cpfCnpj);
    });
  });
});
