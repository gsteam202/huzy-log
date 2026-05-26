import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { promisify } from "node:util";
import { createPool, loadEnv } from "./shared.mjs";

loadEnv();

const execFileAsync = promisify(execFile);
const pollInterval = Number(process.env.LOG_COLLECT_INTERVAL_MS ?? 10000);
const watch = process.argv.includes("--watch");

function classifyLogLine(stream, message) {
  if (
    stream === "error" ||
    /\b(error|exception|fatal|failed|failure|panic|unhandled|traceback|econnrefused|timeout)\b/i.test(message) ||
    /\b(5\d{2}|EADDRINUSE|ENOMEM|SIGSEGV|TypeError|ReferenceError|SyntaxError)\b/.test(message)
  ) {
    return "error";
  }
  if (/\b(warn|warning|deprecated|retry|slow)\b/i.test(message)) return "warning";
  if (/\b(success|succeeded|started|listening|ready|completed|connected|ok)\b/i.test(message)) return "success";
  return "info";
}

function fingerprint(message) {
  const normalized = message
    .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, "<timestamp>")
    .replace(/\b\d+\b/g, "<number>")
    .replace(/[a-f0-9]{16,}/gi, "<hash>")
    .slice(0, 1000);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function getPm2Apps() {
  const { stdout } = await execFileAsync("pm2", ["jlist"], { maxBuffer: 20 * 1024 * 1024 });
  const apps = JSON.parse(stdout);
  const map = new Map();
  for (const app of apps) {
    map.set(app.name, {
      name: app.name,
      out: app.pm2_env?.pm_out_log_path,
      error: app.pm2_env?.pm_err_log_path
    });
  }
  return map;
}

async function readNewChunk(filePath, offset) {
  const stat = await fs.stat(filePath);
  const start = stat.size < offset ? 0 : offset;
  if (stat.size <= start) {
    return { lines: [], nextOffset: stat.size, fileSize: stat.size };
  }

  const handle = await fs.open(filePath, "r");
  try {
    const length = stat.size - start;
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);
    const text = buffer.toString("utf8");
    const lines = [];
    let cursor = start;
    for (const raw of text.split(/\n/)) {
      const bytes = Buffer.byteLength(raw + "\n");
      const message = raw.replace(/\r$/, "");
      if (message.trim()) {
        lines.push({ message, byteStart: cursor, byteEnd: cursor + bytes });
      }
      cursor += bytes;
    }
    return { lines, nextOffset: stat.size, fileSize: stat.size };
  } finally {
    await handle.close();
  }
}

async function collectOnce(pool) {
  const [projects] = await pool.query(
    "SELECT id, name, pm2_app_name FROM projects ORDER BY id ASC"
  );
  if (projects.length === 0) return;

  const pm2Apps = await getPm2Apps();

  for (const project of projects) {
    const pm2App = pm2Apps.get(project.pm2_app_name);
    if (!pm2App) {
      console.warn(`PM2 app not found: ${project.pm2_app_name}`);
      continue;
    }

    for (const stream of ["out", "error"]) {
      const filePath = pm2App[stream];
      if (!filePath) continue;

      const [offsetRows] = await pool.execute(
        "SELECT byte_offset FROM log_offsets WHERE project_id = :projectId AND stream = :stream LIMIT 1",
        { projectId: project.id, stream }
      );
      const offset = Number(offsetRows[0]?.byte_offset ?? 0);

      try {
        const chunk = await readNewChunk(filePath, offset);
        for (const line of chunk.lines) {
          await pool.execute(
            `INSERT INTO log_entries
             (project_id, pm2_app_name, stream, severity, message, fingerprint, file_path, byte_start, byte_end)
             VALUES
             (:projectId, :pm2AppName, :stream, :severity, :message, :fingerprint, :filePath, :byteStart, :byteEnd)`,
            {
              projectId: project.id,
              pm2AppName: project.pm2_app_name,
              stream,
              severity: classifyLogLine(stream, line.message),
              message: line.message,
              fingerprint: fingerprint(line.message),
              filePath,
              byteStart: line.byteStart,
              byteEnd: line.byteEnd
            }
          );
        }

        await pool.execute(
          `INSERT INTO log_offsets (project_id, stream, file_path, byte_offset, file_size)
           VALUES (:projectId, :stream, :filePath, :byteOffset, :fileSize)
           ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), byte_offset = VALUES(byte_offset), file_size = VALUES(file_size)`,
          {
            projectId: project.id,
            stream,
            filePath,
            byteOffset: chunk.nextOffset,
            fileSize: chunk.fileSize
          }
        );
      } catch (error) {
        console.error(`Failed to collect ${project.pm2_app_name} ${stream}:`, error.message);
      }
    }
  }
}

const pool = createPool();

try {
  do {
    await collectOnce(pool);
    if (watch) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  } while (watch);
} finally {
  if (!watch) await pool.end();
}
