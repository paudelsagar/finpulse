import { createClient } from '@clickhouse/client';

const chPort = process.env.CH_PORT || '8123';
const chUrl = process.env.CLICKHOUSE_URL || `http://localhost:${chPort}`;

export const clickhouse = createClient({
  url: chUrl,
  database: 'finpulse',
  username: 'default',
  password: '',
});

/**
 * Executes a ClickHouse query and returns the rows
 */
export async function queryClickHouse<T>(query: string): Promise<T[]> {
  try {
    const resultSet = await clickhouse.query({
      query,
      format: 'JSONEachRow',
    });
    return (await resultSet.json()) as T[];
  } catch (error) {
    console.error('ClickHouse Query Error:', error);
    throw error;
  }
}
