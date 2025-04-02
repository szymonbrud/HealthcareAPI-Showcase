import { body, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { BaseUserType } from '../auth.types';
import dotenv from 'dotenv';
import { ROUTES } from '../../../constants/routes';
import { LoginUser } from './login.service';
import { LoginSuccessResponseDto } from './loginResponse.dto';
import { AppError } from '../../../utils/AppError';
import { validateDTOs } from '../../../utils/validateDTOs';

export const loginValidators = [
  body('email').isEmail().withMessage('Podaj prawidłowy adres email'),
  body('password').notEmpty().withMessage('Hasło jest wymagane'),
];

dotenv.config();

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  // Sprawdzenie błędów walidacji
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const authenticate = (req: Request, res: Response) => {
    return new Promise(
      (
        resolve: ({
          user,
          info,
        }: {
          user: BaseUserType | null;
          info: { message: never };
        }) => unknown,
        reject,
      ) => {
        passport.authenticate(
          'local',
          { session: false },
          (err: Error, user: BaseUserType | null, info: { message: never }) => {
            if (err) return reject(err);
            resolve({ user, info });
          },
        )(req, res);
      },
    );
  };

  try {
    const { user, info } = await authenticate(req, res);

    if (!user) {
      next(new AppError(info?.message || 'Nieprawidłowe dane logowania', 401));
      return;
    }

    const { refreshToken, accessToken } = await LoginUser(user);

    // zwracamy refresh_token w ciasteczku
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: `/api${ROUTES.BASE_AUTH}${ROUTES.AUTH.REFRESH}`,
    });

    const successResponseData: LoginSuccessResponseDto = {
      message: 'Zalogowano pomyślnie',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    const validatedSuccessResponseData = await validateDTOs(
      LoginSuccessResponseDto,
      successResponseData,
    );

    res.json(validatedSuccessResponseData);
  } catch (err: unknown) {
    next(err);
  }
};
