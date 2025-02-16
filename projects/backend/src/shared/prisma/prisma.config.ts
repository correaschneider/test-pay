import { registerAs } from '@nestjs/config';

export default registerAs('prisma', () => ({
  url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/pay',
  logging: process.env.PRISMA_LOGGING === 'true',
  softDelete: {
    enabled: true,
    field: 'deletedAt',
  },
}));
