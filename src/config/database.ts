import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'clinic',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // maksymalna liczba klientów w puli
  idleTimeoutMillis: 30000, // czas bezczynności po którym klient jest zwalniany
  connectionTimeoutMillis: 2000, // czas oczekiwania na połączenie
});

// Nasłuchiwanie na błędy połączenia
pool.on('error', (err) => {
  console.error('Nieoczekiwany błąd w puli połączeń', err);
  process.exit(-1);
});

export interface Idb {
  query: (text: string, params?: any[]) => Promise<QueryResult>;
  getPool: () => Pool;
  getClient: () => Promise<PoolClient>;
}

const db: Idb = {
  query: (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params),
  getPool: () => pool,
  getClient: () => pool.connect(),
};

export default db;
