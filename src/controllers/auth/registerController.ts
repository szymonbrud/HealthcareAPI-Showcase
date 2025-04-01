import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { insertUser, selectUserDataByEmail } from '../../models/authModels';

export const registerValidators = [
  body('email').isEmail().withMessage('Podaj prawidłowy adres email'),
  body('password').isLength({ min: 8 }).withMessage('Hasło musi mieć co najmniej 8 znaków'),
  body('name').notEmpty().withMessage('Imię jest wymagane'),
  body('surname').notEmpty().withMessage('Nazwisko jest wymagane'),
];

export const registerController = async (req: Request, res: Response) => {
  try {
    // Sprawdzenie błędów walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, surname, email, password } = req.body;

    // Sprawdzenie, czy użytkownik już istnieje
    const userExists = await selectUserDataByEmail(email);
    if (userExists) {
      res.status(409).json({ message: 'Użytkownik z tym adresem email już istnieje' });
      return;
    }

    // Hash-owanie hasła
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Zapisanie użytkownika w bazie danych
    const user = await insertUser({ hashedPassword, email, name, surname });

    res.status(201).json({
      message: 'Użytkownik został zarejestrowany pomyślnie',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Błąd podczas rejestracji:', error);
    res.status(500).json({
      message: 'Wystąpił błąd podczas rejestracji',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Nieznany błąd'
          : undefined,
    });
  }
};
