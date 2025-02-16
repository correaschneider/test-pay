import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsExpirationDateValidConstraint } from '../validators/expiration-date.validator';

export class CreditCardDto {
  @IsString({
    message: 'Número do cartão deve ser uma string',
  })
  number: string;

  @IsString({
    message: 'Nome do titular do cartão deve ser uma string',
  })
  holderName: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  @Validate(IsExpirationDateValidConstraint)
  expirationMonth: number;

  @IsNumber()
  @Validate(IsExpirationDateValidConstraint)
  expirationYear: number;

  @IsString()
  @Length(3, 4)
  ccv: string;
}

export class CreatePaymentDto {
  @IsString()
  customerId: string;

  @IsEnum(['BILL', 'CREDIT_CARD', 'PIX'], {
    message: 'Tipo de pagamento deve ser BILL, CREDIT_CARD ou PIX',
  })
  billingType: 'BILL' | 'CREDIT_CARD' | 'PIX';

  @IsNumber()
  value: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardDto)
  creditCard?: CreditCardDto;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;
}
