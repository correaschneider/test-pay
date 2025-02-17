export interface Payment {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  status: string;
  description?: string;
  externalReference?: string;
  pixQrCode?: string;
  bankSlipUrl?: string;
  paymentDate?: string;
}
