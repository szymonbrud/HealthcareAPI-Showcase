import { generateRefreshToken, generateToken } from '../../utils/jwtUtils';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { insertRefreshToken } from '../../models/authModels';
import { BaseUserType } from '../../constants/types/authTypes';

export const LoginUser = async (user: BaseUserType) => {
  const accessToken = generateToken(user.id);

  const refreshTokenId = uuidv4();
  const refreshToken = generateRefreshToken(user.id, refreshTokenId);

  const salt = await bcrypt.genSalt(10);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

  // refreshToken expires in 1d
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + Number(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_NUMBER_OF_DAYS || 1),
  );

  await insertRefreshToken({
    userId: user.id,
    hashedRefreshToken,
    refreshTokenId,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
  };
};
