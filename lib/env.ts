export const env = {
  db: {
    host: process.env.DATABASE_HOST ?? "1.226.84.145",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    database: process.env.DATABASE_NAME ?? "huzy_log",
    user: process.env.DATABASE_USER ?? "huzy_log",
    password: process.env.DATABASE_PASSWORD ?? "huzylog123!@#"
  },
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "change-this-before-production-huzy-log",
  collectIntervalMs: Number(process.env.LOG_COLLECT_INTERVAL_MS ?? 10000)
};
