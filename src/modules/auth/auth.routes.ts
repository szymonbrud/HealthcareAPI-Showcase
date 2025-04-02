import express from 'express';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { registerValidators, registerController } from './register/register.controller';
import { ROUTES } from '../../constants/routes';
import { loginController, loginValidators } from './login/login.controller';
import { refreshController } from './refresh/refresh.controller';

const router = express.Router();

router.post(ROUTES.AUTH.REGISTER, registerValidators, registerController);

router.post(ROUTES.AUTH.LOGIN, loginValidators, loginController);

router.post(ROUTES.AUTH.REFRESH, refreshController);

router.get('/me', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

export default router;
