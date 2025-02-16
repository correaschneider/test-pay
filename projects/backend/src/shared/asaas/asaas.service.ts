import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { Customer } from '../../modules/customers/interfaces/customer.interface';
import { AsaasErrorLog } from './interfaces/asaas-error.interface';

@Injectable()
export class AsaasService implements OnModuleInit {
  private api: AxiosInstance;
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiUrl = this.configService.get<string>('asaas.apiUrl');
  private readonly apiVersion =
    this.configService.get<string>('asaas.apiVersion');

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (!this.configService.get('asaas.apiKey')) {
      throw new Error('Missing Asaas API configuration');
    }

    this.api = axios.create({
      baseURL: `${this.apiUrl}/${this.apiVersion}`,
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        access_token: this.configService.get<string>('asaas.apiKey'),
      },
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.logger.error(
          `Asaas API Error: ${error.message}`,
          {
            method: error.config?.method?.toUpperCase(),
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.config?.headers,
            body: error.config?.data as Record<string, unknown>,
          } as AsaasErrorLog,
          'AsaasService',
        );
        return Promise.reject(error);
      },
    );
  }

  async createCustomer(data: any): Promise<AxiosResponse> {
    return this.api.post('/customers', data);
  }

  async createPayment(data: any): Promise<AxiosResponse> {
    return this.api.post('/payments', data);
  }

  async getPayment(id: string): Promise<AxiosResponse> {
    return this.api.get(`/payments/${id}`);
  }

  async findCustomer(cpfCnpj: string): Promise<{ data: Customer }> {
    return this.api.get(`/customers`, { params: { cpfCnpj } });
  }
}
