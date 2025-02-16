import { CreditCardDto } from '../../modules/payments/dto/create-payment.dto';
import { AsaasBillingType } from './billing-type.transformer';

export interface AsaasPaymentDto {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  creditCard?: CreditCardDto;
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
  };
}
