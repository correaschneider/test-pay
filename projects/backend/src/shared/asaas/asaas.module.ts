import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import asaasConfig from './asaas.config';
import { AsaasService } from './asaas.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      load: [asaasConfig],
    }),
  ],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class AsaasModule {}
