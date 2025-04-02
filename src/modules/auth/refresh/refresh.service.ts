import { generateRefreshToken, generateToken, verifyRefreshToken } from '../../../utils/jwtUtils';
import { refreshTokenTransaction, selectRefreshTokenByTokenId } from '../auth.models';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../../utils/AppError';

export const refreshService = async (jwt: string) => {
  const data = verifyRefreshToken(jwt);
  const { tokenId, userId } = data as { userId: number; tokenId: string };

  // walidacja tokenu w bazie danych
  const result = await selectRefreshTokenByTokenId(tokenId);

  if (!result) {
    throw new AppError('Brak autoryzacji', 401);
  }

  // is tokens the same
  const isMatch = await bcrypt.compare(jwt, result.token_hash);
  if (!isMatch) {
    throw new AppError('Brak autoryzacji', 401);
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

  return {
    refreshToken,
    accessToken,
  };
};
