import express from 'express';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { registerValidators, registerController } from '../../controllers/auth/registerController';
import { ROUTES } from '../../constants/routes';
import { loginController, loginValidators } from '../../controllers/auth/loginController';
import { refreshController } from '../../controllers/auth/refreshController';

const router = express.Router();

router.post(ROUTES.AUTH.REGISTER, registerValidators, registerController);

router.post(ROUTES.AUTH.LOGIN, loginValidators, loginController);

router.post(ROUTES.AUTH.REFRESH, refreshController);

router.get('/me', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

export default router;
