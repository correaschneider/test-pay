import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhook } from './interfaces/payment-webhook.interface';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Get('customer/:customerId')
  findByCustomerId(@Param('customerId') customerId: string) {
    return this.paymentsService.findByCustomerId(customerId);
  }

  @Post('webhook')
  handleWebhook(@Body() webhook: PaymentWebhook) {
    return this.paymentsService.handleWebhook(webhook);
  }
}
