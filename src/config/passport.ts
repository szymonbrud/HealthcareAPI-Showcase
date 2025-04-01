import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { selectUserDataByEmail, selectUserDataById } from '../models/authModels';

// Konfiguracja strategii lokalnej (email + hasło)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await selectUserDataByEmail(email);

        if (!user) return done(null, false, { message: 'Nieprawidłowy email lub hasło' });

        // Porównaj hasło
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: 'Nieprawidłowy email lub hasło' });

        // Zwróć użytkownika bez hasła
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// Konfiguracja strategii JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload: { id: number }, done) => {
    try {
      // Znajdź użytkownika na podstawie ID z tokenu
      const user = await selectUserDataById(payload.id);

      if (!user) return done(null, false);

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }),
);

export default passport;
