export interface Customer {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

export interface CustomerResponse {
  data: Customer[];
}

export interface CreateCustomerResponse {
  data: Customer;
}

export interface FindCustomerResponse {
  data: Customer;
}
