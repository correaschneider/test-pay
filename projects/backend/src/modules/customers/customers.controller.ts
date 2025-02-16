import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get(':cpfCnpj')
  findByCpfCnpj(@Param('cpfCnpj') cpfCnpj: string) {
    return this.customersService.findByCpfCnpj(cpfCnpj);
  }
}
