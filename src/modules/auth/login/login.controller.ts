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

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Adres email zarejestrowanego użytkownika.
 *           example: 'user@example.com'
 *         password:
 *           type: string
 *           format: password
 *           description: Hasło użytkownika (min. 8 znaków).
 *           example: 'password123'
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginSuccessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Komunikat potwierdzający pomyślne zalogowanie.
 *           example: 'Zalogowano pomyślnie'
 *         accessToken:
 *           type: string
 *           format: jwt
 *           description: Token JWT służący do autoryzacji kolejnych żądań. Ważny przez krótki czas (np. 15 minut).
 *           example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzQ0MTExMzkyLCJleHAiOjE3NDQxMTE5OTJ9.075fmaYBHDK2Lz3x0J6Tbijh0dVzEE_6cbte6qwlLkw'
 *         user:
 *           $ref: '#/components/schemas/BaseUserInfo' # Odwołanie do globalnego, reużywalnego schematu
 *       required:
 *         - message
 *         - accessToken
 *         - user
 */

// --- Definicja endpointu logowania ---

/**
 * @openapi
 * /auth/login:  # Usunięto /api/v1 - jest ono częścią `servers` w globalnej konfiguracji
 *   post:
 *     tags:
 *       - Autentykacja  # Odwołanie do tagu zdefiniowanego globalnie
 *     summary: Logowanie użytkownika i uzyskanie tokenów
 *     description: |
 *       Uwierzytelnia użytkownika na podstawie adresu e-mail i hasła.
 *       W odpowiedzi zwraca krótkotrwały `accessToken` do autoryzacji żądań
 *       oraz ustawia ciasteczko `jwt` (HttpOnly, Secure) z długotrwałym `refreshToken`
 *       służącym do odświeżania sesji.
 *     security: [] # Nadpisuje globalne `security`, bo ten endpoint nie wymaga autentykacji
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials' # Odwołanie do schematu zdefiniowanego wyżej w tym pliku
 *     responses:
 *       '200':
 *         description: OK - Użytkownik pomyślnie zalogowany.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: jwt=eyJhbGci...; Max-Age=86400; Path=/api/v1/auth/refresh; Expires=Sat, 01 Jan 2025 00:00:00 GMT; HttpOnly; Secure; SameSite=None
 *             description: Ciasteczko HttpOnly zawierające refreshToken. Używane przez endpoint `/auth/refresh`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccessResponse' # Odwołanie do schematu zdefiniowanego wyżej
 *       '400':
 *         description: Bad Request - Błędy walidacji danych wejściowych (np. nieprawidłowy email, brak hasła).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse' # Odwołanie do globalnego schematu błędu
 *             example:
 *               status: "fail"
 *               statusCode: 400
 *               message: "Validation failed"
 *               errors: { email: "Podaj prawidłowy adres email" }
 *       '401':
 *         description: Unauthorized - Nieprawidłowe dane logowania (błędny email lub hasło).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "fail"
 *               statusCode: 401
 *               message: "Nieprawidłowy email lub hasło"
 *       '500':
 *         description: Internal Server Error - Wewnętrzny błąd serwera.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               statusCode: 500
 *               message: "Wystąpił nieoczekiwany błąd serwera."
 */
export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  // Sprawdzenie błędów walidacji
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError('Validation failed', 400));
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
      path: `${ROUTES.BASE}${ROUTES.BASE_AUTH}${ROUTES.AUTH.REFRESH}`,
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
