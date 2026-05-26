import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { sha256 } from "@/lib/security";

type TokenRow = import("mysql2/promise").RowDataPacket & {
  id: number;
  project_id: number;
  name: string;
  project_name: string;
  pm2_app_name: string;
};

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const rows = await query<TokenRow[]>(
    `SELECT t.id, t.project_id, t.name, p.name AS project_name, p.pm2_app_name
     FROM project_tokens t
     JOIN projects p ON p.id = t.project_id
     WHERE t.token_hash = :tokenHash
     LIMIT 1`,
    { tokenHash: sha256(token) }
  );
  const tokenRow = rows[0];
  if (!tokenRow) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  await execute("UPDATE project_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = :id", { id: tokenRow.id });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const severity = url.searchParams.get("severity") ?? "error";
  const logs = await query(
    `SELECT id, stream, severity, message, fingerprint, file_path, created_at
     FROM log_entries
     WHERE project_id = :projectId AND severity = :severity
     ORDER BY id DESC
     LIMIT ${limit}`,
    { projectId: tokenRow.project_id, severity }
  );
  const groups = await query(
    `SELECT fingerprint, COUNT(*) AS count, MAX(created_at) AS last_seen_at, SUBSTRING_INDEX(MAX(CONCAT(id, '||', message)), '||', -1) AS sample
     FROM log_entries
     WHERE project_id = :projectId AND severity = :severity
     GROUP BY fingerprint
     ORDER BY last_seen_at DESC
     LIMIT 50`,
    { projectId: tokenRow.project_id, severity }
  );

  return NextResponse.json({
    project: {
      id: tokenRow.project_id,
      name: tokenRow.project_name,
      pm2AppName: tokenRow.pm2_app_name
    },
    severity,
    logs,
    groups
  });
}
