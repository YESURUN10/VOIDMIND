import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { newDb } from 'pg-mem';
import * as schema from './schema.ts';

const { Pool } = pg;

export interface DatabaseContext {
  db: ReturnType<typeof drizzle<typeof schema>>;
  pool: pg.Pool | any;
  isEmulatedPg: boolean;
  query: (text: string, params?: any[]) => Promise<any>;
  getClient: () => Promise<any>;
  transaction: <T>(callback: (client: any) => Promise<T>) => Promise<T>;
}

declare global {
  var _voidMindDb: DatabaseContext | undefined;
}

export function initializeDatabase(): DatabaseContext {
  if (global._voidMindDb) {
    return global._voidMindDb;
  }

  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const sqlUser = process.env.SQL_USER;
  const sqlPassword = process.env.SQL_PASSWORD;

  // 1. Live Production External PostgreSQL (via pg.Pool)
  if (sqlHost && sqlDbName && sqlUser) {
    const pool = new Pool({
      host: sqlHost,
      user: sqlUser,
      password: sqlPassword,
      database: sqlDbName,
      max: 10,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[VoidMind PostgreSQL] Idle client error:', err);
    });

    const drizzleDb = drizzle(pool, { schema });

    const getClient = async () => pool.connect();
    const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const res = await callback(client);
        await client.query('COMMIT');
        return res;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    };

    global._voidMindDb = {
      db: drizzleDb,
      pool,
      isEmulatedPg: false,
      query: (text: string, params?: any[]) => pool.query(text, params),
      getClient,
      transaction,
    };

    return global._voidMindDb;
  }

  // 2. Verified In-Process Relational Engine (pg-mem fallback for test/dev sandboxes)
  const memDb = newDb();
  memDb.public.registerFunction({
    name: 'now',
    returns: (newDb() as any).pgType?.timestamp || undefined,
    implementation: () => new Date(),
  });

  const pgAdapter = memDb.adapters.createPg();
  const pool = new pgAdapter.Pool();
  const drizzleDb = drizzle(pool, { schema });

  const getClient = async () => pool.connect();
  const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
    // pg-mem rollback checkpoint
    const backup = memDb.backup();
    const client = await pool.connect();
    try {
      const res = await callback(client);
      return res;
    } catch (err) {
      backup.restore();
      throw err;
    } finally {
      if (client.release) client.release();
    }
  };

  global._voidMindDb = {
    db: drizzleDb,
    pool,
    isEmulatedPg: true,
    query: async (text: string, params?: any[]) => {
      return pool.query(text, params);
    },
    getClient,
    transaction,
  };

  return global._voidMindDb;
}

export const dbContext = initializeDatabase();
export const db = dbContext.db;
