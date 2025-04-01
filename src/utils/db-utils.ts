import db from '../config/database';

/**
 * Funkcja do bezpiecznego wykonywania zapytań SQL
 */
export async function executeQuery<T>(query: string, params?: any[]): Promise<T[]> {
  try {
    const result = await db.query(query, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Błąd podczas wykonywania zapytania:', error);
    throw error;
  }
}

/**
 * Funkcja do wykonania pojedynczego zapytania (zwraca pierwszy wiersz lub null)
 */
export async function executeQuerySingle<T>(query: string, params?: any[]): Promise<T | null> {
  const rows = await executeQuery<T>(query, params);
  return rows.length > 0 ? rows[0] : null;
}
