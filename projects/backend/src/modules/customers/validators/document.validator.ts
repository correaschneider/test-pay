import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDocumentValid', async: false })
export class IsDocumentValidConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return false;

    // Remove caracteres especiais
    const cleanValue = value.replace(/[^\d]/g, '');

    // Verifica se tem 11 (CPF) ou 14 (CNPJ) dígitos
    if (cleanValue.length !== 11 && cleanValue.length !== 14) return false;

    // Verifica se não são números repetidos
    if (/^(\d)\1+$/.test(cleanValue)) return false;

    return cleanValue.length === 11
      ? this.validateCPF(cleanValue)
      : this.validateCNPJ(cleanValue);
  }

  private validateCPF(cpf: string): boolean {
    let sum = 0;
    let rest: number;

    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;

    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  private validateCNPJ(cnpj: string): boolean {
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    // Primeiro dígito verificador
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Segundo dígito verificador
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  defaultMessage() {
    return 'O documento informado não é válido';
  }
}
