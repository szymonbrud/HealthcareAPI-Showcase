import { BaseUserType, IRefreshToken, IUser } from './auth.types';
import db from '../../config/database';
import { PoolClient } from 'pg';

export const selectUserDataByEmail = async (
  email: IUser['email'],
): Promise<Pick<IUser, 'id' | 'email' | 'role' | 'password'>> => {
  const result = await db.query('SELECT id, email, role, password FROM users WHERE email = $1', [
    email,
  ]);

  return result.rows[0];
};

export const selectUserDataById = async (id: IUser['id']): Promise<BaseUserType> => {
  const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const insertUser = async ({
  name,
  surname,
  email,
  hashedPassword,
}: {
  name: IUser['name'];
  surname: IUser['surname'];
  email: IUser['email'];
  hashedPassword: IUser['hashedPassword'];
}): Promise<BaseUserType> => {
  const result = await db.query(
    'INSERT INTO users (name, surname, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, email, role',
    [name, surname, email, hashedPassword, 'user'],
  );

  return result.rows[0];
};

export const insertRefreshToken = async (
  {
    userId,
    refreshTokenId,
    hashedRefreshToken,
    expiresAt,
  }: {
    userId: IUser['id'];
    refreshTokenId: IRefreshToken['token_id'];
    hashedRefreshToken: IRefreshToken['token_hash'];
    expiresAt: IRefreshToken['expires_at'];
  },
  client?: PoolClient,
) => {
  const localDB = client || db;
  await localDB.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, token_id, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, hashedRefreshToken, refreshTokenId, expiresAt],
  );
};

export const selectRefreshTokenByTokenId = async (
  tokenId: IRefreshToken['token_id'],
): Promise<Pick<IRefreshToken, 'token_hash'>> => {
  const result = await db.query(
    'SELECT token_hash from refresh_tokens WHERE token_id = $1 AND expires_at > NOW()',
    [tokenId],
  );
  return result.rows[0];
};

const deleteRefreshTokenByTokenId = async (
  tokenId: IRefreshToken['token_id'],
  client?: PoolClient,
) => {
  const localDB = client || db;
  await localDB.query('DELETE FROM refresh_tokens WHERE token_id = $1', [tokenId]);
};

export const refreshTokenTransaction = async ({
  userId,
  refreshTokenId,
  hashedRefreshToken,
  expiresAt,
}: {
  userId: IUser['id'];
  refreshTokenId: IRefreshToken['token_id'];
  hashedRefreshToken: IRefreshToken['token_hash'];
  expiresAt: IRefreshToken['expires_at'];
}) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    await insertRefreshToken({ hashedRefreshToken, refreshTokenId, expiresAt, userId }, client);
    await deleteRefreshTokenByTokenId(refreshTokenId, client);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
