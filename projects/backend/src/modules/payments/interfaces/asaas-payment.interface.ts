import { CreditCardDto } from '../dto/create-payment.dto';
import { AsaasBillingType } from '../transformers/billing-type.transformer';

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
