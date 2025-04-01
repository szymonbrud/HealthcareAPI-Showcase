import 'reflect-metadata';

import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth/authRoutes';
import passport from './config/passport';
import cookieParser from 'cookie-parser';
import { notFoundHandler } from './middlewares/notFoundHandlerMiddleware';
import { errorHandler } from './middlewares/errorHandlerMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Inicjalizacja Passport
app.use(passport.initialize());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Przychodnia API działa!');
});

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});
