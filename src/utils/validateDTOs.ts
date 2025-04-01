import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppError } from './AppError';

export const validateDTOs = async <T extends object>(
  DTOValidator: ClassConstructor<T>,
  data: object,
) => {
  const userDtoInstance = plainToInstance(DTOValidator, data, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true, // Spróbuje przekonwertować typy
  });

  // Waliduj instancję DTO za pomocą class-validator
  const errors = await validate(userDtoInstance);

  if (errors.length > 0) {
    console.error('Błąd walidacji DTO odpowiedzi:', errors);

    throw new AppError('Wystąpił błąd podczas logowania', 500);
  }

  return userDtoInstance;
};
