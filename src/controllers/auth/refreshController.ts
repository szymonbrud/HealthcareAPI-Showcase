import { Request, Response } from 'express';
import { generateRefreshToken, generateToken, verifyRefreshToken } from '../../utils/jwtUtils';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { refreshTokenTransaction, selectRefreshTokenByTokenId } from '../../models/authModels';
import { ROUTES } from '../../constants/routes';

export const refreshController = async (req: Request, res: Response) => {
  const { jwt } = req.cookies;
  if (!jwt) {
    res.sendStatus(401);
    return;
  }

  try {
    // weryfikacja ważności tokenu
    const data = verifyRefreshToken(jwt);
    const { tokenId, userId } = data as { userId: number; tokenId: string };

    // walidacja tokenu w bazie danych
    const result = await selectRefreshTokenByTokenId(tokenId);

    if (!result) {
      res.sendStatus(401);
      return;
    }

    // is tokens the same
    const isMatch = await bcrypt.compare(jwt, result.token_hash);
    if (!isMatch) {
      res.sendStatus(401);
      return;
    }

    // generate new tokens
    const accessToken = generateToken(userId);

    const refreshTokenId = uuidv4();
    const refreshToken = generateRefreshToken(userId, refreshTokenId);

    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    // refreshToken expires in 1d
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await refreshTokenTransaction({ hashedRefreshToken, refreshTokenId, expiresAt, userId });

    // zwracamy refresh_token w ciasteczku
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: `/api${ROUTES.BASE_AUTH}${ROUTES.AUTH.REFRESH}`,
    });

    // TODO: to powinnno być w tym TDOS czy coś takiego
    res.json({
      accessToken,
    });
  } catch (err) {
    console.error(err);
    console.error('ereeererre');
    res.sendStatus(401);
    return;
  }
};
