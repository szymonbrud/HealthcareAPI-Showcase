export enum UserRole {
  user = 'user',
  doctor = 'doctor',
  secretary = 'secretary',
}

export interface IUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
}

export type BaseUserType = Pick<IUser, 'id' | 'email' | 'role'>;

export interface IRefreshToken {
  id: number;
  user_id: Pick<IUser, 'id'>;
  token_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}
