import { BaseUserType, IRefreshToken, IUser } from '../constants/types/authTypes';
import db from '../config/database';
import { PoolClient } from 'pg';

export const selectUserDataByEmail = async (
  email: string,
): Promise<Pick<IUser, 'id' | 'email' | 'role' | 'password'>> => {
  const result = await db.query('SELECT id, email, role, password FROM users WHERE email = $1', [
    email,
  ]);

  return result.rows[0];
};

export const selectUserDataById = async (id: number): Promise<BaseUserType> => {
  const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const insertUser = async ({
  name,
  surname,
  email,
  hashedPassword,
}: {
  name: string;
  surname: string;
  email: string;
  hashedPassword: string;
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
    // TODO: te typy chyba też nie powinnny być z palca, czyli userid nie powinon być z palca że to number
    // TODO: a może to właśnie powinno być zawsze wybierane za pomcocą PICK z user
    userId: number;
    refreshTokenId: string;
    hashedRefreshToken: string;
    expiresAt: Date;
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
  tokenId: string,
): Promise<Pick<IRefreshToken, 'token_hash'>> => {
  const result = await db.query(
    'SELECT token_hash from refresh_tokens WHERE token_id = $1 AND expires_at > NOW()',
    [tokenId],
  );
  return result.rows[0];
};

const deleteRefreshTokenByTokenId = async (tokenId: string, client?: PoolClient) => {
  const localDB = client || db;
  await localDB.query('DELETE FROM refresh_tokens WHERE token_id = $1', [tokenId]);
};

export const refreshTokenTransaction = async ({
  userId,
  refreshTokenId,
  hashedRefreshToken,
  expiresAt,
}: {
  userId: number;
  refreshTokenId: string;
  hashedRefreshToken: string;
  expiresAt: Date;
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
