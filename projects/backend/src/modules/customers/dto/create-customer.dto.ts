import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  Validate,
} from 'class-validator';
import { IsDocumentValidConstraint } from '../validators/document.validator';

export class CreateCustomerDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @Length(3, 100, { message: 'Nome deve ter entre 3 e 100 caracteres' })
  name: string;

  @IsString({ message: 'CPF/CNPJ deve ser uma string' })
  @Matches(/^\d{11}$|^\d{14}$/, {
    message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
  })
  @Validate(IsDocumentValidConstraint)
  cpfCnpj: string;

  @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Telefone celular deve ser uma string' })
  mobilePhone?: string;

  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Número do endereço deve ser uma string' })
  addressNumber?: string;

  @IsOptional()
  @IsString({ message: 'Complemento do endereço deve ser uma string' })
  complement?: string;

  @IsOptional()
  @IsString({ message: 'Província deve ser uma string' })
  province?: string;

  @IsOptional()
  @IsString({ message: 'CEP deve ser uma string' })
  @Length(8, 8, { message: 'CEP deve ter 8 dígitos' })
  postalCode?: string;
}
