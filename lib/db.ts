import mysql, { type RowDataPacket } from "mysql2/promise";
import { env } from "@/lib/env";

const globalForPool = globalThis as unknown as {
  huzyLogPool?: mysql.Pool;
};

export const pool =
  globalForPool.huzyLogPool ??
  mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: "+09:00"
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.huzyLogPool = pool;
}

export async function query<T extends RowDataPacket[]>(sql: string, params: Record<string, unknown> = {}) {
  const [rows] = await pool.query<T>(sql, params as never);
  return rows;
}

export async function execute(sql: string, params: Record<string, unknown> = {}) {
  const [result] = await pool.execute(sql, params as never);
  return result;
}
