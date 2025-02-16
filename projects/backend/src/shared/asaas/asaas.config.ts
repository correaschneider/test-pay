import { registerAs } from '@nestjs/config';

export default registerAs('asaas', () => ({
  apiKey: process.env.ASAAS_API_KEY || 'sk_test_1234567890',
  apiUrl: process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/',
  apiVersion: process.env.ASAAS_API_VERSION || 'v3',
  headers: {
    'Content-Type': 'application/json',
    access_token: process.env.ASAAS_API_KEY || 'sk_test_1234567890',
  },
}));
