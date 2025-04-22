import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AppError } from '../utils/AppError';

// Middleware do ochrony tras
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error, user: { id: number; email: string; role: string } | null) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        next(new AppError('Nieautoryzowany dostęp', 401));
        return;
      }

      req.user = user;
      next();
    },
  )(req, res, next);
};

// Middleware do sprawdzania roli
// export const authorizeRole = (roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Nieautoryzowany dostęp' });
//     }
//
//     // TODO: tutaj jest problem bo jak req.user będzie null lub coś co nie jest obiektem to wywali mi się tutaj serwer, jak temu zapobiedz?
//     const userRole = (req.user as any).role;
//
//     if (!roles.includes(userRole)) {
//       return res.status(403).json({ message: 'Brak wymaganych uprawnień' });
//     }
//
//     next();
//   };
// };
