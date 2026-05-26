import bcrypt from "bcryptjs";
import { createPool, schemaSql } from "./shared.mjs";

const pool = createPool();

try {
  for (const sql of schemaSql) {
    await pool.query(sql);
  }

  const passwordHash = await bcrypt.hash("admin", 12);
  await pool.execute(
    `INSERT INTO users (username, password_hash, role, must_change_password)
     VALUES ('admin', :passwordHash, 'admin', 1)
     ON DUPLICATE KEY UPDATE username = username`,
    { passwordHash }
  );

  console.log("Database initialized. Admin login: admin / admin");
} finally {
  await pool.end();
}
