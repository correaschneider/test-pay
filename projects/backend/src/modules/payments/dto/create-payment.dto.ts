import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  customerId: string;

  @IsEnum(['BOLETO', 'CREDIT_CARD', 'PIX'], {
    message: 'Tipo de pagamento deve ser BOLETO, CREDIT_CARD ou PIX',
  })
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';

  @IsNumber()
  value: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;
}
