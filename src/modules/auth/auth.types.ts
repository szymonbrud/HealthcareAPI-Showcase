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
  hashedPassword: string;
  role: UserRole;
  created_at: Date;
}

export type BaseUserType = Pick<IUser, 'id' | 'email' | 'role'>;

export interface IRefreshToken {
  id: number;
  user_id: IUser['id'];
  token_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}
