export interface AsaasErrorLog {
  method?: string;
  url?: string;
  status?: number;
  data?: unknown;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
}
