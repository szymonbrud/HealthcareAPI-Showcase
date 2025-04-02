import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { registerService } from './register.service';
import { RegisterSuccessResponseDto } from './registerResponse.dto';
import { validateDTOs } from '../../../utils/validateDTOs';

export const registerValidators = [
  body('email').isEmail().withMessage('Podaj prawidłowy adres email'),
  body('password').isLength({ min: 8 }).withMessage('Hasło musi mieć co najmniej 8 znaków'),
  body('name').notEmpty().withMessage('Imię jest wymagane'),
  body('surname').notEmpty().withMessage('Nazwisko jest wymagane'),
];

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sprawdzenie błędów walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, surname, email, password } = req.body;

    const user = await registerService({
      email,
      name,
      surname,
      password,
    });

    const successResponseData: RegisterSuccessResponseDto = {
      message: 'Użytkownik został zarejestrowany pomyślnie',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    const validatedSuccessResponseData = await validateDTOs(
      RegisterSuccessResponseDto,
      successResponseData,
    );

    res.status(201).json(validatedSuccessResponseData);
  } catch (error) {
    next(error);
  }
};
