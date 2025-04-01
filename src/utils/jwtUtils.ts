import jwt, { JwtPayload } from 'jsonwebtoken';
import type { StringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'your-secret-key';

type ExpiresInType = string | number;

// Funkcja walidująca poprawność formatu expiresIn
const isValidExpiresIn = (value: string): boolean => {
  // Sprawdzenie czy wartość jest liczbą
  if (!isNaN(Number(value))) return true;

  // Sprawdzenie formatów typu "1d", "2h", "30m", "45s"
  const timePattern = /^(\d+)([smhdw])$/;
  return timePattern.test(value);
};

// Bezpieczne pobranie wartości JWT_EXPIRES_IN z env
const getExpiresIn = (): ExpiresInType => {
  const defaultValue = '1d';
  const envValue = process.env.JWT_EXPIRES_IN;

  if (!envValue) return defaultValue;
  if (isValidExpiresIn(envValue)) return envValue;

  console.warn(`Invalid JWT_EXPIRES_IN value: "${envValue}". Using default: "${defaultValue}"`);
  return defaultValue;
};

const JWT_EXPIRES_IN = getExpiresIn() as StringValue | number;
const JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS = `${
  process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_NUMBER_OF_DAYS as string | 1
}d` as StringValue;

export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (userId: number, tokenId: string): string => {
  return jwt.sign(
    {
      userId,
      tokenId,
    },
    JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS },
  );
};

export const verifyRefreshToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, JWT_REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error(`Invalid token, ${error}`);
  }
};
