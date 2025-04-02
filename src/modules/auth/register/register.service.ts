import { insertUser, selectUserDataByEmail } from '../auth.models';
import bcrypt from 'bcrypt';
import { AppError } from '../../../utils/AppError';
import { BaseUserType, IUser } from '../auth.types';

export const registerService = async ({
  email,
  password,
  name,
  surname,
}: {
  email: IUser['email'];
  password: IUser['password'];
  name: IUser['name'];
  surname: IUser['surname'];
}): Promise<BaseUserType> => {
  const userExists = await selectUserDataByEmail(email);
  if (userExists) {
    throw new AppError('Użytkownik z tym adresem email już istnieje', 409);
  }

  // Hash-owanie hasła
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Zapisanie użytkownika w bazie danych
  return await insertUser({ hashedPassword, email, name, surname });
};
