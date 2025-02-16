import { BadRequestException } from '@nestjs/common';

export type AsaasBillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX';
export type AppBillingType = 'BILL' | 'CREDIT_CARD' | 'PIX';

const billingTypeMap: Record<AppBillingType, AsaasBillingType> = {
  BILL: 'BOLETO',
  CREDIT_CARD: 'CREDIT_CARD',
  PIX: 'PIX',
};

export class BillingTypeTransformer {
  static toAsaas(type: AppBillingType): AsaasBillingType {
    const asaasType = billingTypeMap[type];
    if (!asaasType) {
      throw new BadRequestException(`Invalid billing type: ${type}`);
    }
    return asaasType;
  }

  static toApp(type: AsaasBillingType): AppBillingType {
    const appType = Object.entries(billingTypeMap).find(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value === type,
    )?.[0] as AppBillingType;

    if (!appType) {
      throw new BadRequestException(`Invalid Asaas billing type: ${type}`);
    }
    return appType;
  }
}
