import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isExpirationDateValid', async: false })
export class IsExpirationDateValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() retorna 0-11

    if (args.property === 'expirationYear') {
      return value >= currentYear;
    }

    if (args.property === 'expirationMonth') {
      const year = (args.object as { expirationYear: number }).expirationYear;

      if (year === currentYear) {
        return value >= currentMonth;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    if (args.property === 'expirationYear') {
      return 'O ano de expiração não pode ser menor que o ano atual';
    }
    return 'A data de expiração não pode ser menor que a data atual';
  }
}
