// Plik: src/modules/auth/login/login.service.test.ts
// lub src/modules/auth/login/__tests__/login.service.test.ts

import { LoginUser } from './login.service';
import { generateRefreshToken, generateToken } from '../../../utils/jwtUtils';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { authRepository } from '../auth.models';
import { BaseUserType, UserRole } from '../auth.types';

// --- Mockowanie zależności (tak jak poprzednio) ---
jest.mock('../../../utils/jwtUtils');
jest.mock('uuid');
jest.mock('bcrypt');
jest.mock('../auth.models', () => ({
  authRepository: {
    insertRefreshToken: jest.fn(),
  },
}));

// --- Typowanie dla mocków (tak jak poprzednio) ---
const mockedGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
const mockedGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<
  typeof generateRefreshToken
>;
const mockedUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;
const mockedBcryptGenSalt = bcrypt.genSalt as jest.MockedFunction<typeof bcrypt.genSalt>;
const mockedBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockedInsertRefreshToken = authRepository.insertRefreshToken as jest.MockedFunction<
  typeof authRepository.insertRefreshToken
>;

// --- Test Suite ---
describe('LoginUser Service', () => {
  const mockUser: BaseUserType = { id: 1234, email: 'user@user.com', role: UserRole.user };
  const mockAccessToken = 'generated.access.token';
  const mockRefreshToken = 'generated.refresh.token';
  const mockRefreshTokenId = 'unique-refresh-id';
  const mockHashedToken = 'hashed-refresh-token';

  let originalEnv: NodeJS.ProcessEnv;
  const systemTime = new Date('2024-05-22T10:00:00.000Z'); // Stała data do testów

  // --- Użycie Fałszywych Timerów ---
  beforeAll(() => {
    jest.useFakeTimers(); // Włącz sztuczne timery dla całego suite
  });

  afterAll(() => {
    jest.useRealTimers(); // Przywróć prawdziwe timery po zakończeniu suite
  });
  // --- Koniec konfiguracji timerów ---

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
    delete process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_NUMBER_OF_DAYS; // Upewnij się, że jest czyste

    // --- Ustawienie stałego czasu systemowego dla każdego testu ---
    jest.setSystemTime(systemTime);
    // --- Koniec ustawiania czasu ---

    // Ustawienie mocków
    mockedGenerateToken.mockReturnValue(mockAccessToken);
    mockedGenerateRefreshToken.mockReturnValue(mockRefreshToken);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    mockedUuidv4.mockReturnValue(mockRefreshTokenId);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    mockedBcryptGenSalt.mockResolvedValue('$2b$10$someSalt');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    mockedBcryptHash.mockResolvedValue(mockHashedToken);
    mockedInsertRefreshToken.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    // Nie ma potrzeby resetować czasu tutaj, bo setSystemTime w beforeEach robi to na nowo
  });

  it('should return an access token and a refresh token', async () => {
    const result = await LoginUser(mockUser);
    expect(result).toEqual({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
  });

  it('should save the refresh token details to the repository', async () => {
    await LoginUser(mockUser);
    expect(mockedInsertRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockedInsertRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        refreshTokenId: mockRefreshTokenId,
        hashedRefreshToken: mockHashedToken, // Weryfikujemy, że *jakiś* hash został przekazany
        expiresAt: expect.any(Date),
      }),
    );
  });

  it('should calculate the refresh token expiration date correctly (default 1 day)', async () => {
    // Arrange
    // Czas jest ustawiony na systemTime ('2024-05-21T10:00:00.000Z')
    const expectedDate = new Date(systemTime);
    expectedDate.setDate(expectedDate.getDate() + 1); // Oczekujemy dokładnie 1 dzień później

    // Act
    await LoginUser(mockUser);

    // Assert
    expect(mockedInsertRefreshToken).toHaveBeenCalledTimes(1);
    const callArgs = mockedInsertRefreshToken.mock.calls[0][0];

    expect(callArgs.expiresAt).toBeInstanceOf(Date);
    // Teraz możemy porównać DOKŁADNE wartości, bo czas jest stały
    expect(callArgs.expiresAt.toISOString()).toBe(expectedDate.toISOString());
    // Lub przez getTime() jeśli wolisz:
    // expect(callArgs.expiresAt.getTime()).toBe(expectedDate.getTime());

    // Sprawdzenie reszty danych dla pewności
    expect(callArgs).toEqual(
      expect.objectContaining({
        userId: mockUser.id,
        refreshTokenId: mockRefreshTokenId,
        hashedRefreshToken: mockHashedToken,
      }),
    );
  });

  it('should calculate expiration date based on JWT_REFRESH_TOKEN_EXPIRES_IN_NUMBER_OF_DAYS env var', async () => {
    // Arrange
    const days = 7;
    process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_NUMBER_OF_DAYS = String(days);
    // Czas jest nadal ustawiony na systemTime
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + days); // Oczekujemy dokładnie 'days' dni później

    // Act
    await LoginUser(mockUser);

    // Assert
    expect(mockedInsertRefreshToken).toHaveBeenCalledTimes(1);
    const callArgs = mockedInsertRefreshToken.mock.calls[0][0];

    expect(callArgs.expiresAt).toBeInstanceOf(Date);
    expect(callArgs.expiresAt.toISOString()).toBe(expectedDate.toISOString());
  });

  it('should use default expiration (1 day) if env var is invalid', async () => {
    // Arrange
    process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_NUMBER_OF_DAYS = 'not-a-number';
    // Czas jest nadal ustawiony na systemTime
    const expectedDate = new Date(systemTime);
    expectedDate.setDate(expectedDate.getDate() + 1); // Oczekujemy domyślnego 1 dnia

    // Act
    await LoginUser(mockUser);

    // Assert
    expect(mockedInsertRefreshToken).toHaveBeenCalledTimes(1);
    const callArgs = mockedInsertRefreshToken.mock.calls[0][0];

    expect(callArgs.expiresAt).toBeInstanceOf(Date);
    expect(callArgs.expiresAt.toISOString()).toBe(expectedDate.toISOString());
  });

  it('should propagate error if repository insertion fails', async () => {
    const dbError = new Error('DB Error');
    mockedInsertRefreshToken.mockRejectedValue(dbError);
    await expect(LoginUser(mockUser)).rejects.toThrow(dbError);
    expect(mockedInsertRefreshToken).toHaveBeenCalled();
  });
});
