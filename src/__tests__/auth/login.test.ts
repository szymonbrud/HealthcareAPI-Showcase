import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../server'; // Import your Express application instance
import db from '../../config/database'; // Import your database configuration
import { authRepository } from '../../modules/auth/auth.models'; // Import your repository/model
import { PoolClient } from 'pg';
import { ROUTES } from '../../constants/routes'; // Import PoolClient type if needed for typing

const LOGIN_API_URL = `${ROUTES.BASE}${ROUTES.BASE_AUTH}${ROUTES.AUTH.LOGIN}`;

describe('POST /api/v1/auth/login (Integration Test)', () => {
  // Test constants
  const testUserPassword = 'password123';
  const testUserEmail = 'test.login.integration@example.com';

  // Variables to hold state across tests/hooks
  let client: PoolClient; // Database client for setup/teardown

  // --- Setup: Connect DB, Start Server, Create Schema (Runs once before all tests in this file) ---
  beforeAll(async () => {
    // Connect to the database pool
    client = await db.getPool().connect();

    // TODO: inicjalizacja bazy powinna być w jednym pliku ( bo wiadomo że będzie to re-używane )

    // Ensure the required custom type exists
    try {
      await client.query(`CREATE TYPE user_role AS ENUM ('user', 'doctor', 'secretary');`);
    } catch (error: unknown) {
      // Ignore error if the type already exists (error code 42710 for PostgreSQL)
      if ((error as { code?: string })?.code !== '42710') {
        throw error;
      }
    }

    // Ensure the necessary tables exist (idempotent creation)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'user', -- Ensure a default role if applicable
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token_id UUID NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Added ON DELETE CASCADE
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  });

  // --- Test Isolation: Clean and Seed DB Before Each Test ---
  beforeEach(async () => {
    // 1. Clean relevant tables to ensure test isolation.
    // Using TRUNCATE is fast and resets identity sequences. CASCADE handles foreign keys.
    await client.query(`TRUNCATE TABLE "refresh_tokens" RESTART IDENTITY CASCADE;`);
    await client.query(`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);

    // 2. Seed the database with a test user for the login attempt.
    // Hashing the password just like in the actual registration process.
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);

    // Use the repository to insert the user, mimicking application logic.
    await authRepository.insertUser({
      name: 'Andrew',
      surname: 'Doe',
      email: testUserEmail,
      hashedPassword,
    });
  });

  // --- Teardown: Release Client, Close Server, Close DB Pool (Runs once after all tests) ---
  afterAll(async () => {
    // 1. Release the specific database client used in beforeAll
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Error releasing setup/teardown client:', releaseError);
      }
    }

    // 3. Close the entire database pool *** CRUCIAL STEP ***
    // This should be the very last database-related action.
    try {
      await db.getPool().end();
    } catch (poolEndError) {
      console.error('Error ending DB pool:', poolEndError);
    }
  });

  // === Test Cases ===

  it('should successfully log in a user, return status 200, tokens, and set JWT cookie', async () => {
    // Act: Send a POST request to the login endpoint with valid credentials
    const response = await request(app)
      .post(LOGIN_API_URL)
      .send({ email: testUserEmail, password: testUserPassword });

    // Assert: Check the HTTP response status
    expect(response.status).toBe(200);

    // Assert: Check the response body structure and content
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Zalogowano pomyślnie',
        accessToken: expect.any(String), // Sprawdź, czy jest access token
        user: expect.objectContaining({
          id: expect.any(Number),
          email: testUserEmail,
          role: 'user',
        }),
      }),
    );

    // Assert: Check the JWT refresh token cookie ('jwt' is often the conventional name)
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined(); // Make sure the Set-Cookie header exists
    // Ensure cookies is an array before using array methods like find
    expect(Array.isArray(cookies)).toBe(true);

    // Find the specific cookie named 'jwt' (or whatever you named it)
    const jwtCookie = cookies.find((cookie: string) => cookie.startsWith('jwt='));
    expect(jwtCookie).toBeDefined(); // Ensure the 'jwt' cookie was actually set

    // Check cookie attributes for security and functionality
    expect(jwtCookie).toContain('HttpOnly'); // Prevents client-side script access
    expect(jwtCookie).toContain('Secure'); // Ensures cookie is sent only over HTTPS
    expect(jwtCookie).toContain('SameSite=None'); // Necessary for cross-site requests if frontend/backend are on different domains (often used with Secure)
    // (Suggestion: Use constants for cookie names and paths)
    expect(jwtCookie).toContain('Path=/api/v1/auth/refresh'); // Ensures cookie is sent only to the refresh token endpoint
    // You might also want to check Max-Age or Expires if you set them explicitly
  });

  it('should return 401 Unauthorized for invalid password', async () => {
    // Act: Send request with incorrect password
    const response = await request(app)
      .post(LOGIN_API_URL)
      .send({ email: testUserEmail, password: 'wrongpassword' });

    // Assert: Check for 401 status
    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        status: 'fail',
        statusCode: 401,
      }),
    );
    // Assert: Ensure no cookie is set on failure
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('should return 401 Unauthorized for non-existent user', async () => {
    // Act: Send request with email not in the database
    const response = await request(app)
      .post(LOGIN_API_URL)
      .send({ email: 'nouser@example.com', password: 'anypassword' });

    // Assert: Check for 401 status (or potentially 404, depending on your logic, but 401 is common to avoid user enumeration)
    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        status: 'fail',
        statusCode: 401,
      }),
    );
    // Assert: Ensure no cookie is set on failure
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('should return 400 Bad Request if email is missing', async () => {
    // Act: Send request without email
    const response = await request(app).post(LOGIN_API_URL).send({ password: testUserPassword });

    // Assert: Check for 400 status
    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        status: 'fail',
        statusCode: 400,
      }),
    );
  });

  it('should return 400 Bad Request if password is missing', async () => {
    // Act: Send request without password
    const response = await request(app).post(LOGIN_API_URL).send({ email: testUserEmail });

    // Assert: Check for 400 status
    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        status: 'fail',
        statusCode: 400,
      }),
    );
  });
});
