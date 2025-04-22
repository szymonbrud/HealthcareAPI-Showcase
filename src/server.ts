import 'reflect-metadata';

import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './modules/auth/auth.routes';
import passport from './config/passport';
import cookieParser from 'cookie-parser';
import { notFoundHandler } from './middlewares/notFoundHandlerMiddleware';
import { errorHandler } from './middlewares/errorHandlerMiddleware';
import { ROUTES } from './constants/routes';
import { openapiSpecification } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Inicjalizacja Passport
app.use(passport.initialize());

// Routes
app.use(`${ROUTES.BASE}${ROUTES.BASE_AUTH}`, authRoutes);

// Documentation endpoint ( only in development mode )
if (process.env.NODE_ENV === 'development') {
  app.use(
    `${ROUTES.BASE}${ROUTES.BASE_DOCS}`,
    swaggerUi.serve,
    swaggerUi.setup(openapiSpecification),
  );

  app.get(`${ROUTES.BASE}/api-docs.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openapiSpecification); // Lub JSON.stringify(openapiSpecification, null, 2) dla ładnego formatowania
  });
}

app.get('/', (req, res) => {
  res.send('Przychodnia API działa!');
});

app.use(notFoundHandler);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Serwer uruchomiony na porcie ${PORT}`);
  });
}

export { app };
