import { Global, Module } from '@nestjs/common';
import { AsaasModule } from './asaas/asaas.module';
import { PrismaModule } from './prisma/prisma.module';

@Global()
@Module({
  imports: [AsaasModule, PrismaModule],
  exports: [AsaasModule, PrismaModule],
})
export class SharedModule {}
